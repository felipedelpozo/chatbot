ALTER TABLE "chats" ALTER COLUMN "provider_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "provider_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "model_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "model_id" DROP NOT NULL;--> statement-breakpoint
UPDATE "chats"
SET "provider_id" = NULL, "model_id" = NULL
WHERE "provider_id" = 'demo';
