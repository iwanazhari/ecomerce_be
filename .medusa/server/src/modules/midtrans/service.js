"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const axios_1 = __importDefault(require("axios"));
class MidtransPaymentProvider extends utils_1.AbstractPaymentProvider {
    constructor(container, options) {
        super(container, options);
        this.options = options;
        this.baseUrl = options.isProduction
            ? "https://api.midtrans.com/v2"
            : "https://api.sandbox.midtrans.com/v2";
    }
    async initiatePayment(input) {
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
            const response = await axios_1.default.post(`${this.baseUrl}/charge`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return {
                id: response.data.transaction_id,
                data: response.data,
            };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async authorizePayment(input) {
        try {
            const transactionId = input.data?.transaction_id;
            const response = await axios_1.default.get(`${this.baseUrl}/${transactionId}/status`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            const status = this.mapMidtransStatus(response.data.transaction_status);
            return {
                status,
                data: { ...input.data, ...response.data },
            };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async cancelPayment(input) {
        try {
            const transactionId = input.data?.transaction_id;
            await axios_1.default.post(`${this.baseUrl}/${transactionId}/cancel`, {}, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return { data: input.data };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async capturePayment(input) {
        try {
            const transactionId = input.data?.transaction_id;
            const response = await axios_1.default.post(`${this.baseUrl}/${transactionId}/capture`, {}, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return { data: { ...input.data, ...response.data } };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async refundPayment(input) {
        try {
            const transactionId = input.data?.transaction_id;
            const response = await axios_1.default.post(`${this.baseUrl}/${transactionId}/refund`, {
                refund_key: `refund-${Date.now()}`,
                amount: input.amount,
                reason: "Customer request",
            }, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return { data: { ...input.data, ...response.data } };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async deletePayment(input) {
        return { data: input.data };
    }
    async retrievePayment(input) {
        try {
            const transactionId = input.data?.transaction_id;
            const response = await axios_1.default.get(`${this.baseUrl}/${transactionId}/status`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return { data: { ...input.data, ...response.data } };
        }
        catch (error) {
            return this.buildPaymentError(error);
        }
    }
    async updatePayment(input) {
        return this.initiatePayment(input);
    }
    async getPaymentStatus(input) {
        try {
            const transactionId = input.data?.transaction_id;
            const response = await axios_1.default.get(`${this.baseUrl}/${transactionId}/status`, {
                headers: {
                    Authorization: `Basic ${Buffer.from(this.options.serverKey + ":").toString("base64")}`,
                },
            });
            return {
                status: this.mapMidtransStatus(response.data.transaction_status),
            };
        }
        catch {
            return { status: utils_1.PaymentSessionStatus.ERROR };
        }
    }
    async getWebhookActionAndData(payload) {
        const data = payload.data;
        const transactionStatus = data?.transaction_status;
        switch (transactionStatus) {
            case "settlement":
            case "capture":
                return {
                    action: "captured",
                    data: {
                        session_id: data?.order_id,
                        amount: new utils_1.BigNumber(data?.gross_amount ?? 0),
                    },
                };
            case "pending":
                return {
                    action: "authorized",
                    data: {
                        session_id: data?.order_id,
                        amount: new utils_1.BigNumber(data?.gross_amount ?? 0),
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
                        amount: new utils_1.BigNumber(0),
                    },
                };
            default:
                return {
                    action: "not_supported",
                    data: {
                        session_id: data?.order_id ?? "",
                        amount: new utils_1.BigNumber(0),
                    },
                };
        }
    }
    mapMidtransStatus(status) {
        switch (status) {
            case "settlement":
            case "capture":
                return utils_1.PaymentSessionStatus.AUTHORIZED;
            case "pending":
                return utils_1.PaymentSessionStatus.PENDING;
            case "cancel":
            case "deny":
            case "expire":
                return utils_1.PaymentSessionStatus.CANCELED;
            case "refund":
                return utils_1.PaymentSessionStatus.CAPTURED;
            case "failure":
                return utils_1.PaymentSessionStatus.ERROR;
            default:
                return utils_1.PaymentSessionStatus.REQUIRES_MORE;
        }
    }
    buildPaymentError(error) {
        return {
            error: error.message,
            code: error.response?.status?.toString() ?? "UNKNOWN",
            detail: error.response?.data ?? error.message,
        };
    }
}
MidtransPaymentProvider.identifier = "midtrans";
exports.default = MidtransPaymentProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL21pZHRyYW5zL3NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUF1QkEscURBSW1DO0FBQ25DLGtEQUEwQjtBQVExQixNQUFNLHVCQUF3QixTQUFRLCtCQUF1QjtJQU0zRCxZQUFZLFNBQTBCLEVBQUUsT0FBd0I7UUFDOUQsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxZQUFZO1lBQ2pDLENBQUMsQ0FBQyw2QkFBNkI7WUFDL0IsQ0FBQyxDQUFDLHFDQUFxQyxDQUFDO0lBQzVDLENBQUM7SUFFRCxLQUFLLENBQUMsZUFBZSxDQUNuQixLQUEyQjtRQUUzQixNQUFNLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXZELElBQUksQ0FBQztZQUNILE1BQU0sU0FBUyxHQUFHLElBQUksRUFBRSxrQkFBa0IsSUFBSSxXQUFXLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO1lBRXRFLE1BQU0sT0FBTyxHQUFHO2dCQUNkLFlBQVksRUFBRSxlQUFlO2dCQUM3QixtQkFBbUIsRUFBRTtvQkFDbkIsUUFBUSxFQUFFLFNBQVM7b0JBQ25CLFlBQVksRUFBRSxNQUFNO2lCQUNyQjtnQkFDRCxnQkFBZ0IsRUFBRTtvQkFDaEIsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSztpQkFDaEM7Z0JBQ0QsZ0JBQWdCLEVBQUU7b0JBQ2hCLGFBQWE7b0JBQ2IsZUFBZTtvQkFDZixPQUFPO29CQUNQLFdBQVc7b0JBQ1gsTUFBTTtpQkFDUDthQUNGLENBQUM7WUFFRixNQUFNLFFBQVEsR0FBRyxNQUFNLGVBQUssQ0FB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