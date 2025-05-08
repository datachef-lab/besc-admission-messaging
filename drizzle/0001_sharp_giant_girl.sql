ALTER TABLE "alerts" ADD COLUMN "template" varchar(255);--> statement-breakpoint
ALTER TABLE "alerts" ADD COLUMN "preview_text" text;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_template_unique" UNIQUE("template");