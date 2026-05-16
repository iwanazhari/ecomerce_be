"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const StoreNotification = utils_1.model.define('store_notification', {
    id: utils_1.model.id({ prefix: 'snotif' }).primaryKey(),
    customer_id: utils_1.model.text().index(),
    type: utils_1.model.text(),
    title: utils_1.model.text(),
    message: utils_1.model.text(),
    is_read: utils_1.model.boolean().default(false),
    data: utils_1.model.json().nullable(),
});
exports.default = StoreNotification;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvbm90aWZpY2F0aW9uLWN1c3RvbS9tb2RlbHMvbm90aWZpY2F0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscURBQWlEO0FBRWpELE1BQU0saUJBQWlCLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRTtJQUMzRCxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDLFVBQVUsRUFBRTtJQUMvQyxXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLEtBQUssRUFBRTtJQUNqQyxJQUFJLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUNsQixLQUFLLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUNuQixPQUFPLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRTtJQUNyQixPQUFPLEVBQUUsYUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDdkMsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDOUIsQ0FBQyxDQUFBO0FBRUYsa0JBQWUsaUJBQWlCLENBQUEifQ==