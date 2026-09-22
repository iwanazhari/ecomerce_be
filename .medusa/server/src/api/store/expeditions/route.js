"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const route_1 = require("./route");
/**
 * GET /store/expeditions
 * List all active expeditions (public endpoint for checkout)
 */
async function GET(req, res) {
    const expeditionService = req.scope.resolve(route_1.EXPEDITION_MODULE);
    // Only return active expeditions for public access
    const expeditions = await expeditionService.listExpeditions({
        is_active: true,
    });
    res.json({
        expeditions,
        count: expeditions.length,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL2V4cGVkaXRpb25zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT0Esa0JBWUM7QUFsQkQsbUNBQTJDO0FBRTNDOzs7R0FHRztBQUNJLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHlCQUFpQixDQUFDLENBQUE7SUFFOUQsbURBQW1EO0lBQ25ELE1BQU0sV0FBVyxHQUFHLE1BQU0saUJBQWlCLENBQUMsZUFBZSxDQUFDO1FBQzFELFNBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUMsQ0FBQTtJQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDUCxXQUFXO1FBQ1gsS0FBSyxFQUFFLFdBQVcsQ0FBQyxNQUFNO0tBQzFCLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==