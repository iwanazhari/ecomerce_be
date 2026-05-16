import {
  MedusaContainer,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
  BigNumber,
} from "@medusajs/framework/utils";
import axios from "axios";

type MidtransOptions = {
  clientKey: string;
  serverKey: string;
  isProduction: boolean;
};

class MidtransPaymentProvider extends AbstractPaymentProvider {
  static identifier = "midtrans";

  private options: MidtransOptions;
  private baseUrl: string;

  constructor(container: MedusaContainer, options: MidtransOptions) {
    super(container, options);
    this.options = options;
    this.baseUrl = options.isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const { amount, currency_code, context, data } = input;

    try {
      const sessionId = data?.payment_session_id ?? `session-${Date.now()}`;

      const payload = {
        payment_type: "bank_transfer",
        transaction_details: {
          order_id: sessionId,
          gross_amount: amount,
        },
        customer_details: {
          email: context?.customer?.email,
        },
        enabled_payments: [
          "credit_card",
          "bank_transfer",
          "gopay",
          "shopeepay",
          "qris",
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/charge`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return {
        id: response.data.transaction_id,
        data: response.data,
      };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      const response = await axios.get(
        `${this.baseUrl}/${transactionId}/status`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      const status = this.mapMidtransStatus(response.data.transaction_status);

      return {
        status,
        data: { ...input.data, ...response.data },
      };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      await axios.post(
        `${this.baseUrl}/${transactionId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return { data: input.data };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      const response = await axios.post(
        `${this.baseUrl}/${transactionId}/capture`,
        {},
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return { data: { ...input.data, ...response.data } };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      const response = await axios.post(
        `${this.baseUrl}/${transactionId}/refund`,
        {
          refund_key: `refund-${Date.now()}`,
          amount: input.amount,
          reason: "Customer request",
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return { data: { ...input.data, ...response.data } };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return { data: input.data };
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      const response = await axios.get(
        `${this.baseUrl}/${transactionId}/status`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return { data: { ...input.data, ...response.data } };
    } catch (error: any) {
      return this.buildPaymentError(error);
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    return this.initiatePayment(input);
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const transactionId = input.data?.transaction_id as string;

      const response = await axios.get(
        `${this.baseUrl}/${transactionId}/status`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
          },
        }
      );

      return {
        status: this.mapMidtransStatus(response.data.transaction_status),
      };
    } catch {
      return { status: PaymentSessionStatus.ERROR };
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const data = payload.data as any;
    const transactionStatus = data?.transaction_status;

    switch (transactionStatus) {
      case "settlement":
      case "capture":
        return {
          action: "captured",
          data: {
            session_id: data?.order_id,
            amount: new BigNumber(data?.gross_amount ?? 0),
          },
        };
      case "pending":
        return {
          action: "authorized",
          data: {
            session_id: data?.order_id,
            amount: new BigNumber(data?.gross_amount ?? 0),
          },
        };
      case "cancel":
      case "deny":
      case "expire":
      case "failure":
        return {
          action: "failed",
          data: {
            session_id: data?.order_id ?? "",
            amount: new BigNumber(0),
          },
        };
      default:
        return {
          action: "not_supported",
          data: {
            session_id: data?.order_id ?? "",
            amount: new BigNumber(0),
          },
        };
    }
  }

  private mapMidtransStatus(status?: string): PaymentSessionStatus {
    switch (status) {
      case "settlement":
      case "capture":
        return PaymentSessionStatus.AUTHORIZED;
      case "pending":
        return PaymentSessionStatus.PENDING;
      case "cancel":
      case "deny":
      case "expire":
        return PaymentSessionStatus.CANCELED;
      case "refund":
        return PaymentSessionStatus.CAPTURED;
      case "failure":
        return PaymentSessionStatus.ERROR;
      default:
        return PaymentSessionStatus.REQUIRES_MORE;
    }
  }

  private buildPaymentError(error: any): any {
    return {
      error: error.message,
      code: error.response?.status?.toString() ?? "UNKNOWN",
      detail: error.response?.data ?? error.message,
    };
  }
}

export default MidtransPaymentProvider;
