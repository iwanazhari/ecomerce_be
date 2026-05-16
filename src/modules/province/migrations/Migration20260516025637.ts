import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260516025637 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "province" drop constraint if exists "province_name_unique";`);
    this.addSql(`create table if not exists "province" ("id" text not null, "name" text not null, "code" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "province_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_province_name_unique" ON "province" ("name") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_province_deleted_at" ON "province" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "province" cascade;`);
  }

}
