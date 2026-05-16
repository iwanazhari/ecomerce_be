"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVINCE_MODULE = void 0;
exports.GET = GET;
exports.PROVINCE_MODULE = 'province';
/**
 * GET /store/provinces
 * List all provinces (public, no auth required)
 */
async function GET(req, res) {
    const provinceService = req.scope.resolve(exports.PROVINCE_MODULE);
    const [provinces, count] = await provinceService.listAndCountProvinces({}, {
        order: { name: 'ASC' },
    });
    res.json({
        provinces,
        count,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3Byb3ZpbmNlcy9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQSxrQkFXQztBQWpCWSxRQUFBLGVBQWUsR0FBRyxVQUFVLENBQUE7QUFFekM7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHVCQUFlLENBQUMsQ0FBQTtJQUUxRCxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sZUFBZSxDQUFDLHFCQUFxQixDQUFDLEVBQUUsRUFBRTtRQUN6RSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFO0tBQ3ZCLENBQUMsQ0FBQTtJQUVGLEdBQUcsQ0FBQyxJQUFJLENBQUM7UUFDUCxTQUFTO1FBQ1QsS0FBSztLQUNOLENBQUMsQ0FBQTtBQUNKLENBQUMifQ==