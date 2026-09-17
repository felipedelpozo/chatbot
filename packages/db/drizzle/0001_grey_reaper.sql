CREATE TABLE "provider_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"provider_id" varchar(40) NOT NULL,
	"ciphertext" text NOT NULL,
	"initialization_vector" text NOT NULL,
	"authentication_tag" text NOT NULL,
	"encryption_version" integer DEFAULT 1 NOT NULL,
	"credential_hint" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_credentials_provider_valid" CHECK ("provider_credentials"."provider_id" in ('openai', 'anthropic', 'google')),
	CONSTRAINT "provider_credentials_encryption_version_positive" CHECK ("provider_credentials"."encryption_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "provider_credentials" ADD CONSTRAINT "provider_credentials_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "provider_credentials_owner_id_idx" ON "provider_credentials" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_credentials_owner_provider_unique" ON "provider_credentials" USING btree ("owner_id","provider_id");