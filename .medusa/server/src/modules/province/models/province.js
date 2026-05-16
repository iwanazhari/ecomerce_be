"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const Province = utils_1.model.define('province', {
    id: utils_1.model.id({ prefix: 'prv' }).primaryKey(),
    name: utils_1.model.text().unique(),
    code: utils_1.model.text().nullable(),
});
exports.default = Province;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmluY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9wcm92aW5jZS9tb2RlbHMvcHJvdmluY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUQ7QUFFakQsTUFBTSxRQUFRLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUU7SUFDeEMsRUFBRSxFQUFFLGFBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUU7SUFDNUMsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUU7SUFDM0IsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDOUIsQ0FBQyxDQUFBO0FBRUYsa0JBQWUsUUFBUSxDQUFBIn0=