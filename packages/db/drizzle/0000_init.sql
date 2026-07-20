CREATE TYPE "public"."admin_role" AS ENUM('owner', 'manager');--> statement-breakpoint
CREATE TYPE "public"."contact_channel" AS ENUM('telegram', 'whatsapp', 'instagram', 'email', 'phone');--> statement-breakpoint
CREATE TYPE "public"."customs_category" AS ENUM('original_art', 'souvenir');--> statement-breakpoint
CREATE TYPE "public"."image_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('new', 'discussing', 'quoted', 'agreed', 'paid', 'in_progress', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('catalog', 'custom');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('painting', 'keychain', 'decor', 'other');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'available', 'reserved', 'sold', 'archived');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"role" "admin_role" DEFAULT 'manager' NOT NULL,
	"telegram_chat_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"note" text,
	"actor" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"title_snapshot" text NOT NULL,
	"price_snapshot" bigint,
	"currency_snapshot" char(3),
	"custom_spec" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"public_token" text NOT NULL,
	"type" "order_type" DEFAULT 'catalog' NOT NULL,
	"status" "order_status" DEFAULT 'new' NOT NULL,
	"customer_name" text NOT NULL,
	"contact_channel" "contact_channel" NOT NULL,
	"contact_value" text NOT NULL,
	"customer_comment" text,
	"country" char(2),
	"display_currency" char(3),
	"exchange_rate" text,
	"items_amount" bigint,
	"shipping_amount" bigint,
	"total_amount" bigint,
	"source" text,
	"is_manual" boolean DEFAULT false NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" text NOT NULL,
	"payload" jsonb NOT NULL,
	"dedup_key" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"original_key" text NOT NULL,
	"variants" jsonb,
	"blurhash" text,
	"alt" text,
	"processing_status" "image_status" DEFAULT 'pending' NOT NULL,
	"processing_error" text,
	"is_interior_shot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_slug_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"replaced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"kind" "product_kind" DEFAULT 'painting' NOT NULL,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_unique" boolean DEFAULT true NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"price_amount" bigint,
	"price_currency" char(3) DEFAULT 'KZT' NOT NULL,
	"price_on_request" boolean DEFAULT false NOT NULL,
	"width_mm" integer,
	"height_mm" integer,
	"depth_mm" integer,
	"weight_g" integer,
	"is_fragile" boolean DEFAULT false NOT NULL,
	"customs_category" "customs_category" DEFAULT 'original_art' NOT NULL,
	"materials" text[],
	"year" integer,
	"reserved_until" timestamp with time zone,
	"reserved_by_order_id" uuid,
	"published_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_slug_history" ADD CONSTRAINT "product_slug_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_public_token_idx" ON "orders" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "orders_board_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_events_dedup_idx" ON "outbox_events" USING btree ("dedup_key");--> statement-breakpoint
CREATE INDEX "outbox_events_poll_idx" ON "outbox_events" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "product_images_gallery_idx" ON "product_images" USING btree ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_history_slug_idx" ON "product_slug_history" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_listing_idx" ON "products" USING btree ("status","published_at");