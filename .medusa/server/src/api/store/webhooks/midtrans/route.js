"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
/**
 * POST /store/webhooks/midtrans
 * Handle Midtrans payment notification (webhook)
 */
async function POST(req, res) {
    const payload = req.body;
    const logger = req.scope.resolve("logger");
    logger.info("Midtrans webhook received:", JSON.stringify(payload));
    try {
        const transactionStatus = payload.transaction_status;
        const orderId = payload.order_id;
        logger.info(`Midtrans webhook: transaction ${transactionStatus} for order ${orderId}`);
        res.status(200).json({ status: "ok" });
    }
    catch (error) {
        logger.error("Midtrans webhook error:", error);
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3dlYmhvb2tzL21pZHRyYW5zL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBU0Esb0JBZ0NDO0FBcENEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxJQUFJLENBQ3hCLEdBQWtCLEVBQ2xCLEdBQW1CO0lBRW5CLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQU1uQixDQUFDO0lBRUYsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFRLENBQUM7SUFFbEQsTUFBTSxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFbkUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUM7UUFDckQsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUVqQyxNQUFNLENBQUMsSUFBSSxDQUNULGlDQUFpQyxpQkFBaUIsY0FBYyxPQUFPLEVBQUUsQ0FDMUUsQ0FBQztRQUVGLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUFDLE9BQU8sS0FBVSxFQUFFLENBQUM7UUFDcEIsTUFBTSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNuQixNQUFNLEVBQUUsT0FBTztZQUNmLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztTQUN2QixDQUFDLENBQUM7SUFDTCxDQUFDO0FBQ0gsQ0FBQyJ9