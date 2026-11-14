"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20260516023825 = void 0;
const migrations_1 = require("@medusajs/framework/mikro-orm/migrations");
class Migration20260516023825 extends migrations_1.Migration {
    async up() {
        this.addSql(`alter table if exists "expedition" add column if not exists "flat_rate" numeric not null default 0, add column if not exists "is_store_delivery" boolean not null default false, add column if not exists "raw_flat_rate" jsonb not null default '{"value":"0","precision":20}';`);
    }
    async down() {
        this.addSql(`alter table if exists "expedition" drop column if exists "flat_rate", drop column if exists "is_store_delivery", drop column if exists "raw_flat_rate";`);
    }
}
exports.Migration20260516023825 = Migration20260516023825;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWlncmF0aW9uMjAyNjA1MTYwMjM4MjUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9leHBlZGl0aW9uL21pZ3JhdGlvbnMvTWlncmF0aW9uMjAyNjA1MTYwMjM4MjUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseUVBQXFFO0FBRXJFLE1BQWEsdUJBQXdCLFNBQVEsc0JBQVM7SUFFM0MsS0FBSyxDQUFDLEVBQUU7UUFDZixJQUFJLENBQUMsTUFBTSxDQUFDLGtSQUFrUixDQUFDLENBQUM7SUFDbFMsQ0FBQztJQUVRLEtBQUssQ0FBQyxJQUFJO1FBQ2pCLElBQUksQ0FBQyxNQUFNLENBQUMseUpBQXlKLENBQUMsQ0FBQztJQUN6SyxDQUFDO0NBRUY7QUFWRCwwREFVQyJ9