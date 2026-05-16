import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260516023825 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "expedition" add column if not exists "flat_rate" numeric not null default 0, add column if not exists "is_store_delivery" boolean not null default false, add column if not exists "raw_flat_rate" jsonb not null default '{"value":"0","precision":20}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "expedition" drop column if exists "flat_rate", drop column if exists "is_store_delivery", drop column if exists "raw_flat_rate";`);
  }

}
