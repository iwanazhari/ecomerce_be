"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const utils_1 = require("@medusajs/framework/utils");
const axios_1 = __importDefault(require("axios"));
/**
 * POST /store/payments/:payment_id/snap
 * Create Midtrans Snap token for payment.
 *
 * Body: { cart_id?, order_id?, gross_amount?, customer_details? }
 *
 * Supports two modes:
 * 1. Pre-order (cart-based): pass cart_id + gross_amount + customer_details
 *    Use this to get a Snap token BEFORE cart.complete()
 * 2. Post-order (payment-based): pass payment_id via URL, looks up from payment
 *    Use this for payment status checks after order creation
 */
async function POST(req, res) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    if (!serverKey) {
        return res.status(500).json({ error: 'Midtrans not configured. Set MIDTRANS_SERVER_KEY.' });
    }
    const body = req.body;
    let orderId;
    let grossAmount;
    let customerDetails = body.customer_details;
    // Pre-order mode: use cart data directly
    if (body.cart_id && body.gross_amount) {
        orderId = body.cart_id;
        grossAmount = body.gross_amount;
    }
    else {
        // Post-order mode: look up from payment
        const paymentId = req.params.payment_id;
        const paymentModuleService = req.scope.resolve(utils_1.Modules.PAYMENT);
        const payments = await paymentModuleService.listPayments({ id: paymentId }, { relations: ['payment_session', 'payment_session.cart'] });
        const payment = payments[0];
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        orderId = body.order_id ?? paymentId;
        grossAmount = body.gross_amount ?? Number(payment.amount ?? 0);
    }
    const baseUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    try {
        const response = await axios_1.default.post(baseUrl, {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            customer_details: customerDetails ?? {},
            enabled_payments: ['credit_card', 'bank_transfer', 'gopay', 'shopeepay', 'qris'],
            credit_card: {
                secure: true,
            },
        }, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
            },
        });
        res.json({
            token: response.data.token,
            redirect_url: response.data.redirect_url,
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to create Snap token',
            detail: error.response?.data ?? error.message,
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL3N0b3JlL3BheW1lbnRzL1twYXltZW50X2lkXS9zbmFwL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBZ0JBLG9CQXFGQztBQXBHRCxxREFBbUQ7QUFDbkQsa0RBQXlCO0FBRXpCOzs7Ozs7Ozs7OztHQVdHO0FBQ0ksS0FBSyxVQUFVLElBQUksQ0FBQyxHQUFrQixFQUFFLEdBQW1CO0lBQ2hFLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUE7SUFDakQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsS0FBSyxNQUFNLENBQUE7SUFFbEUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2YsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxtREFBbUQsRUFBRSxDQUFDLENBQUE7SUFDN0YsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQVloQixDQUFBO0lBRUQsSUFBSSxPQUFlLENBQUE7SUFDbkIsSUFBSSxXQUFtQixDQUFBO0lBQ3ZCLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQTtJQUUzQyx5Q0FBeUM7SUFDekMsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUN0QyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQTtRQUN0QixXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUNqQyxDQUFDO1NBQU0sQ0FBQztRQUNOLHdDQUF3QztRQUN4QyxNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUN2QyxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGVBQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUUvRCxNQUFNLFFBQVEsR0FBRyxNQUFNLG9CQUFvQixDQUFDLFlBQVksQ0FDdEQsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLEVBQ2pCLEVBQUUsU0FBUyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxDQUMzRCxDQUFBO1FBRUQsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBQzNCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNiLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFBO1FBQzdELENBQUM7UUFFRCxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxTQUFTLENBQUE7UUFDcEMsV0FBVyxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLENBQUE7SUFDaEUsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLFlBQVk7UUFDMUIsQ0FBQyxDQUFDLCtDQUErQztRQUNqRCxDQUFDLENBQUMsdURBQXVELENBQUE7SUFFM0QsSUFBSSxDQUFDO1FBQ0gsTUFBTSxRQUFRLEdBQUcsTUFBTSxlQUFLLENBQUMsSUFBSSxDQUMvQixPQUFPLEVBQ1A7WUFDRSxtQkFBbUIsRUFBRTtnQkFDbkIsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFlBQVksRUFBRSxXQUFXO2FBQzFCO1lBQ0QsZ0JBQWdCLEVBQUUsZUFBZSxJQUFJLEVBQUU7WUFDdkMsZ0JBQWdCLEVBQUUsQ0FBQyxhQUFhLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxDQUFDO1lBQ2hGLFdBQVcsRUFBRTtnQkFDWCxNQUFNLEVBQUUsSUFBSTthQUNiO1NBQ0YsRUFDRDtZQUNFLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyxhQUFhLEVBQUUsU0FBUyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEVBQUU7YUFDMUU7U0FDRixDQUNGLENBQUE7UUFFRCxHQUFHLENBQUMsSUFBSSxDQUFDO1lBQ1AsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSztZQUMxQixZQUFZLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxZQUFZO1NBQ3pDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ25CLEtBQUssRUFBRSw2QkFBNkI7WUFDcEMsTUFBTSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxJQUFJLEtBQUssQ0FBQyxPQUFPO1NBQzlDLENBQUMsQ0FBQTtJQUNKLENBQUM7QUFDSCxDQUFDIn0=