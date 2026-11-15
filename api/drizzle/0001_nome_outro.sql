ALTER TABLE "problema" ADD COLUMN "nome_outro" varchar(40);--> statement-breakpoint
CREATE INDEX "problema_nome_outro_idx" ON "problema" USING btree ("nome_outro");