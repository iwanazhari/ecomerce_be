"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260516025637 = void 0;
const migrations_1 = require("@medusajs/framework/mikro-orm/migrations");
class Migration20260516025637 extends migrations_1.Migration {
    async up() {
        this.addSql(`alter table if exists "province" drop constraint if exists "province_name_unique";`);
        this.addSql(`create table if not exists "province" ("id" text not null, "name" text not null, "code" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "province_pkey" primary key ("id"));`);
        this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_province_name_unique" ON "province" ("name") WHERE deleted_at IS NULL;`);
        this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_province_deleted_at" ON "province" ("deleted_at") WHERE deleted_at IS NULL;`);
    }
    async down() {
        this.addSql(`drop table if exists "province" cascade;`);
    }
}
exports.Migration20260516025637 = Migration20260516025637;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjA1MTYwMjU2MzcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wcm92aW5jZS9taWdyYXRpb25zL01pZ3JhdGlvbjIwMjYwNTE2MDI1NjM3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlFQUFxRTtBQUVyRSxNQUFhLHVCQUF3QixTQUFRLHNCQUFTO0lBRTNDLEtBQUssQ0FBQyxFQUFFO1FBQ2YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvRkFBb0YsQ0FBQyxDQUFDO1FBQ2xHLElBQUksQ0FBQyxNQUFNLENBQUMscVJBQXFSLENBQUMsQ0FBQztRQUNuUyxJQUFJLENBQUMsTUFBTSxDQUFDLCtHQUErRyxDQUFDLENBQUM7UUFDN0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyw2R0FBNkcsQ0FBQyxDQUFDO0lBQzdILENBQUM7SUFFUSxLQUFLLENBQUMsSUFBSTtRQUNqQixJQUFJLENBQUMsTUFBTSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7SUFDMUQsQ0FBQztDQUVGO0FBYkQsMERBYUMifQ==