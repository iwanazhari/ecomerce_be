import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import axios from 'axios'

/**
 * GET /store/payments/:payment_id/status
 * Get Midtrans payment status.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

  if (!serverKey) {
    return res.status(500).json({ error: 'Midtrans not configured. Set MIDTRANS_SERVER_KEY.' })
  }

  const paymentId = req.params.payment_id

  try {
    const baseUrl = isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2'

    const response = await axios.get(`${baseUrl}/${paymentId}/status`, {
      headers: {
        Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
      },
    })

    const data = response.data
    let status: string
    switch (data.transaction_status) {
      case 'settlement':
      case 'capture':
        status = 'PAID'
        break
      case 'pending':
        status = 'PENDING'
        break
      case 'cancel':
      case 'deny':
      case 'expire':
        status = 'FAILED'
        break
      default:
        status = 'PENDING'
    }

    res.json({ status, provider_status: data.transaction_status, data })
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to get payment status',
      detail: error.response?.data ?? error.message,
    })
  }
}
