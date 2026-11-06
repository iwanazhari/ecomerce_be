"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const WishlistItem = utils_1.model.define('wishlist_item', {
    id: utils_1.model.id({ prefix: 'wish' }).primaryKey(),
    customer_id: utils_1.model.text().index(),
    product_id: utils_1.model.text().index(),
    variant_id: utils_1.model.text().nullable(),
});
exports.default = WishlistItem;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2lzaGxpc3QtaXRlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3dpc2hsaXN0L21vZGVscy93aXNobGlzdC1pdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscURBQWlEO0FBRWpELE1BQU0sWUFBWSxHQUFHLGFBQUssQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFO0lBQ2pELEVBQUUsRUFBRSxhQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsVUFBVSxFQUFFO0lBQzdDLFdBQVcsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0lBQ2pDLFVBQVUsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBSyxFQUFFO0lBQ2hDLFVBQVUsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFO0NBQ3BDLENBQUMsQ0FBQTtBQUVGLGtCQUFlLFlBQVksQ0FBQSJ9