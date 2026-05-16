"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.DELETE = DELETE;
async function POST(req, res) {
    const notificationService = req.scope.resolve('waterproNotification');
    const id = req.params.id;
    await notificationService.updateStoreNotifications({ id, is_read: true });
    res.json({ success: true });
}
async function DELETE(req, res) {
    const notificationService = req.scope.resolve('waterproNotification');
    const id = req.params.id;
    await notificationService.deleteStoreNotifications(id);
    res.json({ deleted: true });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL25vdGlmaWNhdGlvbnMvW2lkXS9yb3V0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLG9CQUtDO0FBQ0Qsd0JBS0M7QUFYTSxLQUFLLFVBQVUsSUFBSSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDaEUsTUFBTSxtQkFBbUIsR0FBUSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQzFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFBO0lBQ3hCLE1BQU0sbUJBQW1CLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDekUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzdCLENBQUM7QUFDTSxLQUFLLFVBQVUsTUFBTSxDQUFDLEdBQWtCLEVBQUUsR0FBbUI7SUFDbEUsTUFBTSxtQkFBbUIsR0FBUSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0lBQzFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFBO0lBQ3hCLE1BQU0sbUJBQW1CLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDdEQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQzdCLENBQUMifQ==