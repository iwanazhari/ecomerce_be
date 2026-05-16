"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPEDITION_MODULE = void 0;
exports.GET = GET;
exports.POST = POST;
exports.EXPEDITION_MODULE = 'expedition';
/**
 * GET /admin/expeditions
 * List all expeditions with pagination
 */
async function GET(req, res) {
    const expeditionService = req.scope.resolve(exports.EXPEDITION_MODULE);
    const { limit = 50, offset = 0, q, code, is_active } = req.query;
    const filter = {};
    if (q)
        filter.$or = [
            { name: { $ilike: `%${q}%` } },
            { code: { $ilike: `%${q}%` } },
        ];
    if (code)
        filter.code = code;
    if (is_active !== undefined)
        filter.is_active = is_active === 'true';
    const [expeditions, count] = await expeditionService.listAndCountExpeditions(filter, {
        skip: parseInt(offset),
        take: parseInt(limit),
    });
    res.json({
        expeditions,
        count,
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
}
/**
 * POST /admin/expeditions
 * Create a new expedition
 */
async function POST(req, res) {
    const expeditionService = req.scope.resolve(exports.EXPEDITION_MODULE);
    const body = req.body;
    const expedition = await expeditionService.createExpeditions({
        name: body.name,
        code: body.code,
        tracking_url_template: body.tracking_url_template ?? null,
        is_active: body.is_active ?? true,
        description: body.description ?? null,
        flat_rate: body.flat_rate ?? 0,
        is_store_delivery: body.is_store_delivery ?? false,
    });
    res.status(201).json({ expedition });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL2V4cGVkaXRpb25zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVFBLGtCQXVCQztBQU1ELG9CQWVDO0FBbERZLFFBQUEsaUJBQWlCLEdBQUcsWUFBWSxDQUFBO0FBRTdDOzs7R0FHRztBQUNJLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLGlCQUFpQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHlCQUFpQixDQUFDLENBQUE7SUFDOUQsTUFBTSxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFZLENBQUE7SUFFdkUsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFBO0lBQ3RCLElBQUksQ0FBQztRQUFFLE1BQU0sQ0FBQyxHQUFHLEdBQUc7WUFDbEIsRUFBRSxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQzlCLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtTQUMvQixDQUFBO0lBQ0QsSUFBSSxJQUFJO1FBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7SUFDNUIsSUFBSSxTQUFTLEtBQUssU0FBUztRQUFFLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxLQUFLLE1BQU0sQ0FBQTtJQUVwRSxNQUFNLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0saUJBQWlCLENBQUMsdUJBQXVCLENBQUMsTUFBTSxFQUFFO1FBQ25GLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO0tBQ3RCLENBQUMsQ0FBQTtJQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDUCxXQUFXO1FBQ1gsS0FBSztRQUNMLEtBQUssRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3RCLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO0tBQ3pCLENBQUMsQ0FBQTtBQUNKLENBQUM7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx5QkFBaUIsQ0FBQyxDQUFBO0lBQzlELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFXLENBQUE7SUFFNUIsTUFBTSxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQztRQUMzRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7UUFDZixxQkFBcUIsRUFBRSxJQUFJLENBQUMscUJBQXFCLElBQUksSUFBSTtRQUN6RCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO1FBQ2pDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUk7UUFDckMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQztRQUM5QixpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSztLQUNuRCxDQUFDLENBQUE7SUFFRixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUE7QUFDdEMsQ0FBQyJ9