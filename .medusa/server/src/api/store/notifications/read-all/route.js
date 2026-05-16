"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
async function POST(req, res) {
    const notificationService = req.scope.resolve('waterproNotification');
    const authContext = req.authContext;
    if (!authContext?.customer_id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const [unread] = await notificationService.listAndCountStoreNotifications({
        customer_id: authContext.customer_id,
        is_read: false,
    });
    if (unread.length > 0) {
        await notificationService.updateStoreNotifications(unread.map((n) => ({ id: n.id, is_read: true })));
    }
    res.json({ success: true });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL25vdGlmaWNhdGlvbnMvcmVhZC1hbGwvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxvQkFjQztBQWRNLEtBQUssVUFBVSxJQUFJLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUNoRSxNQUFNLG1CQUFtQixHQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUE7SUFDMUUsTUFBTSxXQUFXLEdBQUksR0FBVyxDQUFDLFdBQW1ELENBQUE7SUFDcEYsSUFBSSxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsQ0FBQztRQUM5QixPQUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLENBQUMsQ0FBQTtJQUM3RCxDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLE1BQU0sbUJBQW1CLENBQUMsOEJBQThCLENBQUM7UUFDeEUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1FBQ3BDLE9BQU8sRUFBRSxLQUFLO0tBQ2YsQ0FBQyxDQUFBO0lBQ0YsSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sbUJBQW1CLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUMzRyxDQUFDO0lBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzdCLENBQUMifQ==