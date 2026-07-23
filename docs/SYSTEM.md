# Как устроен artshop

Живой документ: обновляется по мере появления функционала. Для ревью по схемам,
а не по коду. Технические обоснования решений — в [architecture.md](architecture.md).

Отметки готовности: ✅ сделано и проверено · 🟡 частично · ⬜ впереди.

---

## Сервисы и как они связаны

Витрина и админка — **разные приложения со своим движком и своим доменом**.
Общее у них — только пакеты (`shared` контракты, `db` схема) и токены дизайна.
Так правки в одном не роняют другое, и каждое деплоится и масштабируется отдельно.

```mermaid
flowchart TB
    subgraph browser[Браузер]
        U[Покупатель]
        A[Админ / Алия]
    end

    WEB[web · Next.js ✅<br/>витрина, свой домен]
    ADM[admin · Next.js ✅<br/>админка, свой домен]
    API[api · NestJS ✅]
    WORKER[worker · медиа ✅ + outbox ✅]
    CG[chat-gateway ⬜]

    PG[(PostgreSQL ✅)]
    REDIS[(Redis ✅)]
    S3[(MinIO / S3 ✅)]
    TG[Telegram ⬜]

    U --> WEB
    A --> ADM
    WEB -->|прокси заявки| API
    ADM -->|напрямую, JWT| API

    API --> PG
    API --> REDIS
    API --> S3

    WORKER -->|разбор outbox ✅| PG
    WORKER -->|обработка фото ✅| S3
    WORKER -->|уведомления ⬜| TG
    CG <-->|сообщения ⬜| API
    CG <--> TG
```

Кто за что отвечает:

| Приложение | Делает | Статус |
|---|---|---|
| `web` | витрина, свой домен | ✅ |
| `admin` | админка, свой домен и движок | ✅ |
| `api` | каталог, заказы, авторизация, CRUD работ, загрузка фото — владеет БД | ✅ |
| `worker` | разбор outbox, обработка фото, расписания | ✅ (кроме уведомлений) |
| `chat-gateway` | мессенджеры: вебхуки, отправка | ⬜ |

Общее (монорепо-пакеты): `packages/shared` (zod-контракты, деньги),
`packages/db` (схема Drizzle), design-токены. Витрина обращается к API через
свой серверный прокси; админка — клиентское приложение, ходит в API напрямую
с JWT-токеном.

---

## Таблицы базы

```mermaid
erDiagram
    products ||--o{ product_images : "фото работы"
    products ||--o{ product_slug_history : "старые адреса"
    orders ||--o{ order_items : "состав заказа"
    orders ||--o{ order_events : "история статусов"
    products ||--o{ order_items : "снимок товара"
    products ||--o| orders : "резерв (reserved_by_order_id)"

    products {
        uuid id PK
        text slug UK "адрес работы, транслит"
        enum kind "painting/keychain/decor"
        enum status "draft/available/reserved/sold/archived"
        bool is_unique "работа в одном экземпляре"
        bigint price_amount "в минорных единицах"
        timestamptz reserved_until "докуда держится бронь"
        uuid reserved_by_order_id "какой заказ занял"
    }
    product_images {
        uuid id PK
        uuid product_id FK
        int position "порядок в галерее"
        jsonb variants "thumb/card/full + размеры"
        text blurhash "заглушка на время загрузки"
        bool is_interior_shot "кадр в интерьере"
        enum processing_status "pending/processing/ready/failed"
    }
    orders {
        uuid id PK
        text number UK "человекочитаемый A-1000"
        text public_token UK "секрет для страницы статуса"
        enum type "catalog/custom"
        enum status "new..delivered/cancelled"
        text customer_name
        enum contact_channel
        text contact_value
        bool is_manual "заведён вручную по разговору вне сайта"
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK "nullable для custom"
        text title_snapshot "снимок: товар мог измениться"
        bigint price_snapshot
    }
    order_events {
        uuid id PK
        uuid order_id FK
        enum from_status
        enum to_status
        text actor "customer/admin/system"
    }
    outbox_events {
        uuid id PK
        text topic "order.created ..."
        jsonb payload
        text dedup_key UK "защита от дублей"
        enum status "pending/sent/failed"
        int attempts
        timestamptz next_retry_at
    }
    admin_users {
        uuid id PK
        text email UK
        text password_hash "argon2"
        enum role "owner/manager"
    }
```

Три сквозных правила модели:

- **деньги** — всегда целое число в минорных единицах (тиын/копейка) + код валюты, никогда не дробью;
- **ничего не удаляется** — проданное и отменённое остаётся, работает статус;
- **снимки в заказе** — название и цена копируются в `order_items`, потому что товар потом может измениться или уйти в архив.

---

## Поток: покупатель оставляет заявку ✅

Готово и проверено. Ключевой момент — резерв уникальной работы и защита от гонки.

```mermaid
sequenceDiagram
    participant U as Покупатель
    participant W as web
    participant API as api
    participant PG as PostgreSQL
    participant WK as worker
    participant TG as Telegram

    U->>W: заполняет форму заявки
    W->>API: POST /orders
    Note over API,PG: одна транзакция — либо всё, либо ничего

    rect rgb(245, 238, 230)
        API->>PG: UPDATE products SET reserved<br/>WHERE status = available
        alt работа была свободна
            PG-->>API: 1 строка → бронь взята
        else кто-то успел раньше
            PG-->>API: 0 строк → alreadyReserved
        end
        API->>PG: INSERT order + order_items (снимок)
        API->>PG: INSERT order_events (new)
        API->>PG: INSERT outbox (order.created)
    end

    API-->>W: номер A-1000 + ссылка на статус
    W-->>U: «Заявка отправлена»

    Note over WK,PG: отдельно, асинхронно
    WK->>PG: выбирает pending из outbox
    WK->>TG: уведомление Алие
    WK->>PG: помечает sent
```

Почему именно так:

- **резерв условным UPDATE, а не блокировкой.** `WHERE status = 'available'` уже
  атомарен: два одновременных запроса не могут оба его пройти. Отдельная
  распределённая блокировка тут была бы лишней. Проверено: вторая заявка на ту же
  работу получает `alreadyReserved`, а не вторую бронь.
- **outbox в той же транзакции.** Уведомление пишется в БД вместе с заказом.
  Упади процесс сразу после — заявка не потеряется, воркер разберёт outbox позже.
  Отправка отделена от приёма: покупатель не ждёт, пока достучимся до Telegram.
- **ретраи.** Не доставили — пробуем через 1, 2, 4… минуты, до 6 раз, потом `failed`.

> Сейчас у воркера нет токена бота, поэтому уведомление пишется в лог, а не в
> Telegram. Подключение — вместе с chat-gateway.

---

## Поток: обработка фотографии ✅

Готово и проверено насквозь: загрузил фото в админке → воркер сделал варианты →
работа опубликована → изображение видно на витрине.

```mermaid
sequenceDiagram
    participant A as Админка ✅
    participant API as api
    participant S3 as MinIO
    participant Q as Redis / BullMQ ✅
    participant WK as worker ✅

    A->>API: запрос на загрузку (upload-url)
    API->>S3: presigned URL, запись image = pending
    API-->>A: ссылка для прямой заливки
    A->>S3: заливает оригинал напрямую (мимо API)
    A->>API: complete
    API->>Q: задача process-image (jobId = img-<id>)
    Note over API: статус processing
    WK->>S3: скачивает оригинал
    Note over WK: sharp: автоповорот по EXIF,<br/>thumb/card/full, WebP,<br/>водяной знак на full, blurhash
    WK->>S3: кладёт варианты
    WK->>API: variants готовы, статус ready
    A->>API: опрашивает статус, показывает превью
```

Ключевое:

- оригиналы грузятся **напрямую в хранилище** по presigned URL, минуя API:
  восьмимегабайтные файлы не должны идти через приложение;
- задача идемпотентна по `jobId = img-<imageId>`: повторное подтверждение не создаёт
  вторую обработку;
- обработка асинхронна, админка опрашивает статус и показывает «обработка…»,
  пока воркер не отдаст `ready`;
- **опубликовать нельзя без готового фото** — кнопка заблокирована, пока нет
  хотя бы одного `ready`-изображения.

---

## Жизненный цикл заказа

```mermaid
stateDiagram-v2
    [*] --> new: заявка
    new --> discussing: пишем в переписке
    discussing --> quoted: назвали цену и доставку
    quoted --> agreed: покупатель согласился
    agreed --> paid: оплата (пока вручную)
    paid --> in_progress: изготовление (для custom)
    in_progress --> shipped: отправлено
    paid --> shipped: отправлено (готовая работа)
    shipped --> delivered: получено
    new --> cancelled
    discussing --> cancelled
    quoted --> cancelled
    delivered --> [*]
    cancelled --> [*]
```

Позже между `agreed` и `paid` встроится платёжный шлюз — без изменения остальной
схемы. Бронь работы снимается фоновой задачей, если заказ так и не дошёл до `agreed`.

---

## Поток: Алия ведёт каталог ✅

Проверено в браузере: вход → создание → фото → публикация → работа на витрине.

```mermaid
flowchart LR
    L[Вход по email+пароль ✅] --> LIST[Список работ ✅]
    LIST --> NEW[Новая работа:<br/>название + тип ✅]
    NEW --> ED[Редактор ✅]
    ED --> UP[Загрузка фото ✅]
    UP -.обработка воркером.-> ED
    ED --> FILL[Цена, размеры, материалы ✅]
    FILL --> PUB[Опубликовать ✅]
    PUB --> SITE[Работа на витрине ✅]
```

Правила, заложенные в интерфейс:

- **slug генерится транслитом из названия** (`Морской бриз` → `morskoy-briz`),
  правится вручную; при смене опубликованного адреса старый пишется в историю
  для редиректа;
- **цена вводится в тенге, хранится в тиынах** целым числом — перевод в UI;
- **размеры в сантиметрах**, в БД в миллиметрах;
- публикация возможна только с готовым фото.

---

## Что дальше по функционалу

| Кусок | Статус |
|---|---|
| Публичный каталог | ✅ |
| Авторизация админки | ✅ |
| Заявка с резервом + outbox | ✅ |
| Админка: создание и редактирование работ | ✅ |
| Загрузка и обработка фото | ✅ |
| Публикация работы на витрину | ✅ |
| Уведомление в Telegram (реальное) | ⬜ ждёт токен |
| Ревалидация витрины по событию из админки | ⬜ |
| Канбан заказов | ⬜ |
| Страница статуса на живых данных | ⬜ |
| chat-gateway, Mini App | ⬜ |
