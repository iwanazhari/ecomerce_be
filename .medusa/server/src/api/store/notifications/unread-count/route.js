"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
async function GET(req, res) {
    const notificationService = req.scope.resolve('waterproNotification');
    const authContext = req.authContext;
    if (!authContext?.customer_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const [, count] = await notificationService.listAndCountStoreNotifications({
        customer_id: authContext.customer_id,
        is_read: false,
    });
    res.json({ count });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL25vdGlmaWNhdGlvbnMvdW5yZWFkLWNvdW50L3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esa0JBV0M7QUFYTSxLQUFLLFVBQVUsR0FBRyxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDL0QsTUFBTSxtQkFBbUIsR0FBUSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQzFFLE1BQU0sV0FBVyxHQUFJLEdBQVcsQ0FBQyxXQUFtRCxDQUFBO0lBQ3BGLElBQUksQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLENBQUM7UUFDOUIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxDQUFDLENBQUE7SUFDN0QsQ0FBQztJQUNELE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sbUJBQW1CLENBQUMsOEJBQThCLENBQUM7UUFDekUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1FBQ3BDLE9BQU8sRUFBRSxLQUFLO0tBQ2YsQ0FBQyxDQUFBO0lBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7QUFDckIsQ0FBQyJ9