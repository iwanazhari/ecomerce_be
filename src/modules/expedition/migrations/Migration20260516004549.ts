import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260516004549 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "expedition" drop constraint if exists "expedition_code_unique";`);
    this.addSql(`create table if not exists "expedition" ("id" text not null, "name" text not null, "code" text not null, "tracking_url_template" text null, "is_active" boolean not null default true, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "expedition_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_expedition_code_unique" ON "expedition" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_expedition_code" ON "expedition" ("code") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_expedition_deleted_at" ON "expedition" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "expedition" cascade;`);
  }

}
