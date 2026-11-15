CREATE TYPE "public"."papel" AS ENUM('MORADOR', 'ADMINISTRADOR');--> statement-breakpoint
CREATE TYPE "public"."status_problema" AS ENUM('ABERTO', 'AVISADO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO');--> statement-breakpoint
CREATE TYPE "public"."tipo_evento" AS ENUM('REGISTRO', 'AVISO_PREFEITURA', 'EM_ANDAMENTO', 'RESOLVIDO', 'CONTESTACAO');--> statement-breakpoint
CREATE TYPE "public"."tipo_problema" AS ENUM('BURACO', 'LIXO_ENTULHO', 'CALCADA', 'ALAGAMENTO', 'OUTRO');--> statement-breakpoint
CREATE TABLE "confirmacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problema_id" uuid NOT NULL,
	"morador_id" uuid NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problema_id" uuid NOT NULL,
	"morador_id" uuid NOT NULL,
	"tipo_evento" "tipo_evento" NOT NULL,
	"status_anterior" "status_problema",
	"status_novo" "status_problema" NOT NULL,
	"observacao" varchar(200),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "morador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(80) NOT NULL,
	"celular" varchar(20) NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "papel" DEFAULT 'MORADOR' NOT NULL,
	"aceite_termos_em" timestamp with time zone NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "morador_celular_unique" UNIQUE("celular")
);
--> statement-breakpoint
CREATE TABLE "problema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_problema" NOT NULL,
	"descricao" varchar(280),
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"referencia_endereco" varchar(120),
	"foto_antes_url" text,
	"foto_depois_url" text,
	"status" "status_problema" DEFAULT 'ABERTO' NOT NULL,
	"protocolo_156" varchar(40),
	"total_confirmacoes" integer DEFAULT 0 NOT NULL,
	"oculto" boolean DEFAULT false NOT NULL,
	"resolvido_em" timestamp with time zone,
	"morador_id" uuid NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "confirmacao" ADD CONSTRAINT "confirmacao_problema_id_problema_id_fk" FOREIGN KEY ("problema_id") REFERENCES "public"."problema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "confirmacao" ADD CONSTRAINT "confirmacao_morador_id_morador_id_fk" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_problema_id_problema_id_fk" FOREIGN KEY ("problema_id") REFERENCES "public"."problema"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_status" ADD CONSTRAINT "historico_status_morador_id_morador_id_fk" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problema" ADD CONSTRAINT "problema_morador_id_morador_id_fk" FOREIGN KEY ("morador_id") REFERENCES "public"."morador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "confirmacao_problema_morador_uq" ON "confirmacao" USING btree ("problema_id","morador_id");--> statement-breakpoint
CREATE INDEX "historico_problema_idx" ON "historico_status" USING btree ("problema_id");--> statement-breakpoint
CREATE INDEX "problema_status_idx" ON "problema" USING btree ("status");--> statement-breakpoint
CREATE INDEX "problema_coordenadas_idx" ON "problema" USING btree ("latitude","longitude");