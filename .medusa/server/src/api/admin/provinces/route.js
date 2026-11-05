"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVINCE_MODULE = void 0;
exports.GET = GET;
exports.POST = POST;
exports.PROVINCE_MODULE = 'province';
/**
 * GET /admin/provinces
 * List all provinces with pagination
 */
async function GET(req, res) {
    const provinceService = req.scope.resolve(exports.PROVINCE_MODULE);
    const { limit = 100, offset = 0, q } = req.query;
    const filter = {};
    if (q)
        filter.name = { $ilike: `%${q}%` };
    const [provinces, count] = await provinceService.listAndCountProvinces(filter, {
        skip: parseInt(offset),
        take: parseInt(limit),
        order: { name: 'ASC' },
    });
    res.json({
        provinces,
        count,
        limit: parseInt(limit),
        offset: parseInt(offset),
    });
}
/**
 * POST /admin/provinces
 * Create a new province
 */
async function POST(req, res) {
    const provinceService = req.scope.resolve(exports.PROVINCE_MODULE);
    const body = req.body;
    const province = await provinceService.createProvinces({
        name: body.name,
        code: body.code ?? null,
    });
    res.status(201).json({ province });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2FkbWluL3Byb3ZpbmNlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQSxrQkFtQkM7QUFNRCxvQkFVQztBQXpDWSxRQUFBLGVBQWUsR0FBRyxVQUFVLENBQUE7QUFFekM7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHVCQUFlLENBQUMsQ0FBQTtJQUMxRCxNQUFNLEVBQUUsS0FBSyxHQUFHLEdBQUcsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxLQUFZLENBQUE7SUFFdkQsTUFBTSxNQUFNLEdBQVEsRUFBRSxDQUFBO0lBQ3RCLElBQUksQ0FBQztRQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBRXpDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxlQUFlLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFO1FBQzdFLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDO1FBQ3JCLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7S0FDdkIsQ0FBQyxDQUFBO0lBRUYsR0FBRyxDQUFDLElBQUksQ0FBQztRQUNQLFNBQVM7UUFDVCxLQUFLO1FBQ0wsS0FBSyxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDdEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUM7S0FDekIsQ0FBQyxDQUFBO0FBQ0osQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLGVBQWUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyx1QkFBZSxDQUFDLENBQUE7SUFDMUQsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtJQUU1QixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQWUsQ0FBQyxlQUFlLENBQUM7UUFDckQsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1FBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSTtLQUN4QixDQUFDLENBQUE7SUFFRixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7QUFDcEMsQ0FBQyJ9