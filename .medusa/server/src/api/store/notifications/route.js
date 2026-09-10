"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
async function GET(req, res) {
    const notificationService = req.scope.resolve('waterproNotification');
    const authContext = req.authContext;
    if (!authContext?.customer_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';
    const filters = { customer_id: authContext.customer_id };
    if (unreadOnly) {
        filters.is_read = false;
    }
    const [items, count] = await notificationService.listAndCountStoreNotifications(filters, {
        skip: offset,
        take: limit,
        order: { created_at: 'DESC' },
    });
    res.json({ notifications: items, count, limit, offset });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL25vdGlmaWNhdGlvbnMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxrQkFtQkM7QUFuQk0sS0FBSyxVQUFVLEdBQUcsQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQy9ELE1BQU0sbUJBQW1CLEdBQVEsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQTtJQUMxRSxNQUFNLFdBQVcsR0FBSSxHQUFXLENBQUMsV0FBbUQsQ0FBQTtJQUNwRixJQUFJLENBQUMsV0FBVyxFQUFFLFdBQVcsRUFBRSxDQUFDO1FBQzlCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO0lBQzdELENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFlLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDdkQsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN4RCxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxNQUFNLENBQUE7SUFDbEQsTUFBTSxPQUFPLEdBQTRCLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQTtJQUNqRixJQUFJLFVBQVUsRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7SUFDekIsQ0FBQztJQUNELE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsTUFBTSxtQkFBbUIsQ0FBQyw4QkFBOEIsQ0FBQyxPQUFPLEVBQUU7UUFDdkYsSUFBSSxFQUFFLE1BQU07UUFDWixJQUFJLEVBQUUsS0FBSztRQUNYLEtBQUssRUFBRSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUU7S0FDOUIsQ0FBQyxDQUFBO0lBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFBO0FBQzFELENBQUMifQ==