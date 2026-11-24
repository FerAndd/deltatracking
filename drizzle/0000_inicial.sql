CREATE TYPE "public"."feedback_tag" AS ENUM('copy', 'color', 'ritmo', 'musica', 'tipografia', 'branding', 'otro');--> statement-breakpoint
CREATE TYPE "public"."piece_status" AS ENUM('por_editar', 'en_edicion', 'enviado_aprobacion', 'cambios_solicitados', 'aprobado');--> statement-breakpoint
CREATE TYPE "public"."piece_type" AS ENUM('reel', 'carrusel', 'post', 'story');--> statement-breakpoint
CREATE TYPE "public"."summary_kind" AS ENUM('editores', 'cliente');--> statement-breakpoint
CREATE TYPE "public"."summary_status" AS ENUM('borrador', 'publicado');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"share_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_slug_unique" UNIQUE("slug"),
	CONSTRAINT "clients_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "editors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piece_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"tag" "feedback_tag",
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pieces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "piece_type" NOT NULL,
	"editor_id" uuid,
	"status" "piece_status" DEFAULT 'por_editar' NOT NULL,
	"round" integer DEFAULT 0 NOT NULL,
	"due_date" date NOT NULL,
	"publish_date" date,
	"file_link" text,
	"delivered" boolean DEFAULT false NOT NULL,
	"delivered_at" timestamp with time zone,
	"brief" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"client_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"piece_id" uuid NOT NULL,
	"from_status" "piece_status",
	"to_status" "piece_status" NOT NULL,
	"round" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"kind" "summary_kind" NOT NULL,
	"week_start" date NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"status" "summary_status" DEFAULT 'borrador' NOT NULL,
	"share_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "summaries_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_piece_id_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_editor_id_editors_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."editors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_events" ADD CONSTRAINT "status_events_piece_id_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;