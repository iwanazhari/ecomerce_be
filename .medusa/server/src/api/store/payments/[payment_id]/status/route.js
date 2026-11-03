"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const axios_1 = __importDefault(require("axios"));
/**
 * GET /store/payments/:payment_id/status
 * Get Midtrans payment status.
 */
async function GET(req, res) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (!serverKey) {
        return res.status(500).json({ error: 'Midtrans not configured. Set MIDTRANS_SERVER_KEY.' });
    }
    const paymentId = req.params.payment_id;
    try {
        const baseUrl = isProduction
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
        const response = await axios_1.default.get(`${baseUrl}/${paymentId}/status`, {
            headers: {
                Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
            },
        });
        const data = response.data;
        let status;
        switch (data.transaction_status) {
            case 'settlement':
            case 'capture':
                status = 'PAID';
                break;
            case 'pending':
                status = 'PENDING';
                break;
            case 'cancel':
            case 'deny':
            case 'expire':
                status = 'FAILED';
                break;
            default:
                status = 'PENDING';
        }
        res.json({ status, provider_status: data.transaction_status, data });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get payment status',
            detail: error.response?.data ?? error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3BheW1lbnRzL1twYXltZW50X2lkXS9zdGF0dXMvcm91dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFPQSxrQkErQ0M7QUFyREQsa0RBQXlCO0FBRXpCOzs7R0FHRztBQUNJLEtBQUssVUFBVSxHQUFHLENBQUMsR0FBa0IsRUFBRSxHQUFtQjtJQUMvRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFBO0lBQ2pELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEtBQUssTUFBTSxDQUFBO0lBRWxFLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNmLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbURBQW1ELEVBQUUsQ0FBQyxDQUFBO0lBQzdGLENBQUM7SUFFRCxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtJQUV2QyxJQUFJLENBQUM7UUFDSCxNQUFNLE9BQU8sR0FBRyxZQUFZO1lBQzFCLENBQUMsQ0FBQyw2QkFBNkI7WUFDL0IsQ0FBQyxDQUFDLHFDQUFxQyxDQUFBO1FBRXpDLE1BQU0sUUFBUSxHQUFHLE1BQU0sZUFBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sSUFBSSxTQUFTLFNBQVMsRUFBRTtZQUNqRSxPQUFPLEVBQUU7Z0JBQ1AsYUFBYSxFQUFFLFNBQVMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2FBQzFFO1NBQ0YsQ0FBQyxDQUFBO1FBRUYsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQTtRQUMxQixJQUFJLE1BQWMsQ0FBQTtRQUNsQixRQUFRLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1lBQ2hDLEtBQUssWUFBWSxDQUFDO1lBQ2xCLEtBQUssU0FBUztnQkFDWixNQUFNLEdBQUcsTUFBTSxDQUFBO2dCQUNmLE1BQUs7WUFDUCxLQUFLLFNBQVM7Z0JBQ1osTUFBTSxHQUFHLFNBQVMsQ0FBQTtnQkFDbEIsTUFBSztZQUNQLEtBQUssUUFBUSxDQUFDO1lBQ2QsS0FBSyxNQUFNLENBQUM7WUFDWixLQUFLLFFBQVE7Z0JBQ1gsTUFBTSxHQUFHLFFBQVEsQ0FBQTtnQkFDakIsTUFBSztZQUNQO2dCQUNFLE1BQU0sR0FBRyxTQUFTLENBQUE7UUFDdEIsQ0FBQztRQUVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQ3RFLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSw4QkFBOEI7WUFDckMsTUFBTSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLEtBQUssQ0FBQyxPQUFPO1NBQzlDLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=