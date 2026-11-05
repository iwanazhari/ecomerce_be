"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const Expedition = utils_1.model.define('expedition', {
    id: utils_1.model.id({ prefix: 'exp' }).primaryKey(),
    name: utils_1.model.text(),
    code: utils_1.model.text().unique().index(),
    tracking_url_template: utils_1.model.text().nullable(),
    is_active: utils_1.model.boolean().default(true),
    description: utils_1.model.text().nullable(),
    /**
     * Flat shipping rate in IDR (rupiah) stored as bigNumber.
     * Used for both external couriers (JNE, J&T) and store delivery.
     */
    flat_rate: utils_1.model.bigNumber().default(0),
    /**
     * Whether this is store's own delivery service.
     * When true: tracking_url_template is ignored, flat_rate can be 0 for free delivery.
     */
    is_store_delivery: utils_1.model.boolean().default(false),
});
exports.default = Expedition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwZWRpdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2V4cGVkaXRpb24vbW9kZWxzL2V4cGVkaXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxxREFBaUQ7QUFFakQsTUFBTSxVQUFVLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUU7SUFDNUMsRUFBRSxFQUFFLGFBQUssQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQyxVQUFVLEVBQUU7SUFDNUMsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUU7SUFDbEIsSUFBSSxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUU7SUFDbkMscUJBQXFCLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUM5QyxTQUFTLEVBQUUsYUFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDeEMsV0FBVyxFQUFFLGFBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDcEM7OztPQUdHO0lBQ0gsU0FBUyxFQUFFLGFBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDOzs7T0FHRztJQUNILGlCQUFpQixFQUFFLGFBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0NBQ2xELENBQUMsQ0FBQTtBQUVGLGtCQUFlLFVBQVUsQ0FBQSJ9