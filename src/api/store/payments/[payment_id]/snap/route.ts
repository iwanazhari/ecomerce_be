import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import axios from 'axios'

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
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

  if (!serverKey) {
    return res.status(500).json({ error: 'Midtrans not configured. Set MIDTRANS_SERVER_KEY.' })
  }

  const body = req.body as {
    cart_id?: string
    order_id?: string
    gross_amount?: number
    customer_details?: {
      first_name?: string
      last_name?: string
      email?: string
      phone?: string
      billing_address?: unknown
      shipping_address?: unknown
    }
  }

  let orderId: string
  let grossAmount: number
  let customerDetails = body.customer_details

  // Pre-order mode: use cart data directly
  if (body.cart_id && body.gross_amount) {
    orderId = body.cart_id
    grossAmount = body.gross_amount
  } else {
    // Post-order mode: look up from payment
    const paymentId = req.params.payment_id
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)

    const payments = await paymentModuleService.listPayments(
      { id: paymentId },
      { relations: ['payment_session', 'payment_session.cart'] },
    )

    const payment = payments[0]
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    orderId = body.order_id ?? paymentId
    grossAmount = body.gross_amount ?? Number(payment.amount ?? 0)
  }

  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  try {
    const response = await axios.post(
      baseUrl,
      {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        customer_details: customerDetails ?? {},
        enabled_payments: ['credit_card', 'bank_transfer', 'gopay', 'shopeepay', 'qris'],
        credit_card: {
          secure: true,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
        },
      },
    )

    res.json({
      token: response.data.token,
      redirect_url: response.data.redirect_url,
    })
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create Snap token',
      detail: error.response?.data ?? error.message,
    })
  }
}
