import type {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

/**
 * POST /store/webhooks/midtrans
 * Handle Midtrans payment notification (webhook)
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const payload = req.body as {
    transaction_status: string;
    order_id: string;
    gross_amount: number;
    payment_type: string;
    transaction_id: string;
  };

  const logger = req.scope.resolve("logger") as any;

  logger.info("Midtrans webhook received:", JSON.stringify(payload));

  try {
    const transactionStatus = payload.transaction_status;
    const orderId = payload.order_id;

    logger.info(
      `Midtrans webhook: transaction ${transactionStatus} for order ${orderId}`
    );

    res.status(200).json({ status: "ok" });
  } catch (error: any) {
    logger.error("Midtrans webhook error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}
