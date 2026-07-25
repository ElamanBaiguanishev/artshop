-- Типы товаров: enum product_kind → управляемая таблица categories.
-- Заказчик сам ведёт типы (создать/переименовать/порядок/архив); мягкое удаление.

CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"color" text,
	"customs_category" "customs_category" DEFAULT 'original_art' NOT NULL,
	"is_fragile_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_position_idx" ON "categories" USING btree ("position");
--> statement-breakpoint

-- Сид из прежних значений enum, с осмысленными дефолтами таможни/хрупкости.
INSERT INTO "categories" ("slug", "name", "position", "customs_category", "is_fragile_default", "color") VALUES
	('painting', 'Живопись', 1, 'original_art', true,  'oklch(0.55 0.09 250)'),
	('keychain', 'Брелок',   2, 'souvenir',     false, 'oklch(0.6 0.11 150)'),
	('decor',    'Декор',    3, 'souvenir',     false, 'oklch(0.62 0.1 70)'),
	('other',    'Другое',   4, 'souvenir',     false, 'oklch(0.55 0.02 260)')
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint

-- Ссылка у товаров: пока nullable, чтобы забэкфиллить.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint

-- Бэкфилл: старый kind → id категории с тем же slug.
UPDATE "products" p SET "category_id" = c."id"
	FROM "categories" c WHERE c."slug" = p."kind"::text;
--> statement-breakpoint

-- Подстраховка на случай неожиданных значений: в «Другое».
UPDATE "products" SET "category_id" = (SELECT "id" FROM "categories" WHERE "slug" = 'other')
	WHERE "category_id" IS NULL;
--> statement-breakpoint

ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products" USING btree ("category_id");
--> statement-breakpoint

-- Убираем legacy enum-колонку и сам тип.
ALTER TABLE "products" DROP COLUMN IF EXISTS "kind";
--> statement-breakpoint
DROP TYPE IF EXISTS "product_kind";
