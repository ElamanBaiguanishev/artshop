# Модель данных

PostgreSQL + Drizzle ORM. Приведены поля, важные для смысла; служебные
(`created_at`, `updated_at`) подразумеваются везде.

## Принципы

1. **Деньги - целое число в минорных единицах** (тиын, копейка, цент) плюс код валюты.
   Никогда не `float` и не `numeric` «на глаз». Цена 45 000 ₸ хранится как `4500000` + `KZT`.
2. **Курс фиксируется в момент заказа.** Иначе сумма «плавает» между просмотром
   и согласованием, и покупатель видит одно, а в переписке слышит другое.
3. **Ничего не удаляется физически.** Проданная работа остаётся в каталоге,
   отменённый заказ остаётся в истории. Мягкое удаление и статусы.
4. **Переводимые поля - отдельной таблицей**, а не колонками `title_ru` / `title_en`.
   Языков будет минимум два, потом может добавиться третий.

---

## Каталог

### products

| Поле | Тип | Смысл |
|---|---|---|
| `id` | uuid | |
| `slug` | text unique | ЧПУ-адрес, генерится из названия, редактируется вручную |
| `kind` | enum | `painting` / `keychain` / `decor` / `other` - влияет на форму и на таможенную позицию |
| `status` | enum | `draft` / `available` / `reserved` / `sold` / `archived` |
| `is_unique` | bool | работа в одном экземпляре; если да - `quantity` игнорируется |
| `quantity` | int | для тиражируемых сувениров |
| `price_amount` | bigint | в минорных единицах |
| `price_currency` | char(3) | базовая валюта хранения, обычно `KZT` |
| `price_on_request` | bool | цена по запросу вместо числа |
| `width_mm`, `height_mm`, `depth_mm` | int | габариты работы |
| `weight_g` | int | вес, нужен для расчёта доставки |
| `is_fragile` | bool | влияет на упаковку и стоимость отправки |
| `materials` | text[] | «холст, масло», «эпоксидная смола» |
| `year` | int | год создания |
| `customs_category` | enum | `original_art` / `souvenir` - у оригинальных работ отдельная товарная позиция и иные правила ввоза |
| `published_at` | timestamptz | |
| `sold_at` | timestamptz | |

**Резервирование.** Для уникальной работы при создании заявки статус переходит
в `reserved`, заполняются `reserved_until` и `reserved_by_order_id`. Перевод делается
в транзакции с проверкой текущего статуса, чтобы двое не забронировали одну картину.
Истёкшие брони снимает периодическая задача.

| Поле | Тип |
|---|---|
| `reserved_until` | timestamptz |
| `reserved_by_order_id` | uuid |

### product_translations

`product_id`, `locale` (`ru` / `en`), `title`, `description`, `meta_title`,
`meta_description`. Первичный ключ - пара `(product_id, locale)`.

### product_images

| Поле | Тип | Смысл |
|---|---|---|
| `id` | uuid | |
| `product_id` | uuid | |
| `position` | int | порядок в галерее, перетаскивается в админке |
| `original_key` | text | ключ оригинала в S3 |
| `variants` | jsonb | сгенерированные производные: `{thumb: {...}, card: {...}, full: {...}}` с ключом, шириной, высотой, форматом |
| `blurhash` | text | заглушка на время загрузки |
| `alt` | text | для SEO и доступности |
| `processing_status` | enum | `pending` / `processing` / `ready` / `failed` |
| `is_interior_shot` | bool | фото в интерьере; такие показываются вторыми, они сильнее продают |

### categories, product_categories

Плоский список меток («абстракция», «пейзаж», «подарок»). Иерархия не нужна
на этом объёме каталога.

---

## Заказы

Модель - согласование, а не чекаут. Заявка приходит без цены, цена появляется
после переписки.

### orders

| Поле | Тип | Смысл |
|---|---|---|
| `id` | uuid | |
| `number` | text unique | человекочитаемый номер, называется в переписке |
| `public_token` | text unique | секрет для страницы статуса без регистрации |
| `type` | enum | `catalog` (готовая работа) / `custom` (изготовление на заказ) |
| `status` | enum | см. ниже |
| `customer_name` | text | |
| `contact_channel` | enum | `whatsapp` / `telegram` / `email` / `phone` |
| `contact_value` | text | |
| `customer_comment` | text | |
| `country` | char(2) | определяет доставку, валюту и таможню |
| `display_currency` | char(3) | валюта, в которой общаемся с покупателем |
| `exchange_rate` | numeric | зафиксирован в момент согласования |
| `items_amount` | bigint | сумма работ, в минорных единицах базовой валюты |
| `shipping_amount` | bigint | доставка, появляется после согласования |
| `total_amount` | bigint | итог |
| `source` | text | `instagram` / `pinterest` / `direct` / utm-метка |
| `admin_note` | text | внутренняя заметка, покупателю не видна |

**Статусы:**

```
new          заявка пришла
discussing   идёт переписка, уточняем детали
quoted       цена и доставка названы, ждём согласия
agreed       покупатель согласился
paid         оплата получена (на первом этапе проставляется вручную)
in_progress  работа изготавливается (для custom)
shipped      отправлено, есть трек-номер
delivered    получено
cancelled    отменено
```

Позже между `agreed` и `paid` встраивается платёжный шлюз - без изменения остальной схемы.

### order_items

`order_id`, `product_id` (nullable для кастома), `title_snapshot`, `price_snapshot`,
`custom_spec` (jsonb: имя для гравировки, цвет, размер, ссылка на загруженный референс).

Снимки названия и цены обязательны: товар потом может измениться или уйти в архив,
а заказ должен остаться читаемым.

### order_events

`order_id`, `from_status`, `to_status`, `note`, `actor` (`admin` / `system` / `customer`),
`created_at`. Полная история переходов - и для админки, и для отладки.

### order_attachments

Файлы от покупателя: фото-референс для портрета, пример желаемого стиля.
`order_id`, `storage_key`, `mime`, `size`.

---

## Контент и продажи

### reviews

`product_id` (nullable - бывает отзыв об авторе в целом), `author_name`, `text`,
`rating`, `photo_key`, `is_published`, `published_at`. Заводятся вручную из переписок.

### pages

`slug`, `locale`, `title`, `body` (markdown), `meta_*`. Редактируются из админки,
чтобы тексты не требовали деплоя.

### waitlist_entries

Лист ожидания на распроданную работу или на новые поступления:
`product_id` (nullable), `contact_channel`, `contact_value`, `locale`.

---

## Служебное

### exchange_rates

`base_currency`, `quote_currency`, `rate`, `fetched_at`. Обновляется по расписанию.
Заказ хранит собственную копию курса, эта таблица - только источник актуального.

### admin_users

`email`, `password_hash`, `role` (`owner` / `admin`), `last_login_at`.
Двух ролей достаточно: владелец видит всё, админ не может удалять и менять цены.

### outbox_events

Надёжная отправка наружу: уведомления в Telegram, события в Conversions API, письма.

`id`, `topic`, `payload` (jsonb), `dedup_key` (unique), `status`
(`pending` / `sent` / `failed`), `attempts`, `next_retry_at`, `sent_at`.

`dedup_key` - тот же `event_id`, что уходит с фронта в Pixel. Именно он делает
повторные отправки безопасными и позволяет Meta склеить браузерное и серверное событие.

### media_jobs

Формально очередь живёт в BullMQ, но для админки удобно видеть состояние в БД:
`image_id`, `status`, `error`, `attempts`. Пишется воркером.

---

## Индексы, которые понадобятся сразу

- `products (status, published_at desc)` - выдача каталога
- `products (slug)` unique - открытие карточки
- `product_images (product_id, position)` - галерея
- `orders (status, created_at desc)` - канбан в админке
- `orders (public_token)` unique - страница статуса
- `outbox_events (status, next_retry_at)` - выборка на отправку
- `outbox_events (dedup_key)` unique - защита от дублей
