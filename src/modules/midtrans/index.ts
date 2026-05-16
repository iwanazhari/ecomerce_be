import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import MidtransPaymentProvider from "./service";

export const MIDTRANS_MODULE = "midtrans";

export default ModuleProvider(Modules.PAYMENT, {
  services: [MidtransPaymentProvider],
});
