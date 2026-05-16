"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260516004549 = void 0;
const migrations_1 = require("@medusajs/framework/mikro-orm/migrations");
class Migration20260516004549 extends migrations_1.Migration {
    async up() {
        this.addSql(`alter table if exists "expedition" drop constraint if exists "expedition_code_unique";`);
        this.addSql(`create table if not exists "expedition" ("id" text not null, "name" text not null, "code" text not null, "tracking_url_template" text null, "is_active" boolean not null default true, "description" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "expedition_pkey" primary key ("id"));`);
        this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_expedition_code_unique" ON "expedition" ("code") WHERE deleted_at IS NULL;`);
        this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_expedition_code" ON "expedition" ("code") WHERE deleted_at IS NULL;`);
        this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_expedition_deleted_at" ON "expedition" ("deleted_at") WHERE deleted_at IS NULL;`);
    }
    async down() {
        this.addSql(`drop table if exists "expedition" cascade;`);
    }
}
exports.Migration20260516004549 = Migration20260516004549;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjA1MTYwMDQ1NDkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9leHBlZGl0aW9uL21pZ3JhdGlvbnMvTWlncmF0aW9uMjAyNjA1MTYwMDQ1NDkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUVBQXFFO0FBRXJFLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVM7SUFFM0MsS0FBSyxDQUFDLEVBQUU7UUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLHdGQUF3RixDQUFDLENBQUM7UUFDdEcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvWUFBb1ksQ0FBQyxDQUFDO1FBQ2xaLElBQUksQ0FBQyxNQUFNLENBQUMsbUhBQW1ILENBQUMsQ0FBQztRQUNqSSxJQUFJLENBQUMsTUFBTSxDQUFDLHFHQUFxRyxDQUFDLENBQUM7UUFDbkgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpSEFBaUgsQ0FBQyxDQUFDO0lBQ2pJLENBQUM7SUFFUSxLQUFLLENBQUMsSUFBSTtRQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLDRDQUE0QyxDQUFDLENBQUM7SUFDNUQsQ0FBQztDQUVGO0FBZEQsMERBY0MifQ==