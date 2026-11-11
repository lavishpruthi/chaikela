/** Chaikela backend: shared constants. Script properties needed before setup(): ADMIN_PHONE, ADMIN_PASSWORD */
const ROLES = { CUSTOMER: "R101", MERCHANT: "R102", ADMIN: "R103" };
/** Allowed status path per fulfilment type. The merchant moves an order one step forward at a time. */
const FLOW = {
  DELIVERY: [
    "PLACED",
    "CONFIRMED",
    "PREPARING",
    "PREPARED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ],
  RAPIDO: [
    "PLACED",
    "CONFIRMED",
    "PREPARING",
    "PREPARED",
    "PICKED_UP",
    "DELIVERED",
  ],
  TAKEAWAY: ["PLACED", "CONFIRMED", "PREPARING", "PREPARED", "DELIVERED"],
};
/** Defaults; admin can edit them from the Settings tab (stored in the Settings sheet). */
const DEFAULT_SETTINGS = {
  GST_PERCENT: "5",
  HANDLING_FEE: "5",
  DELIVERY_FEE: "30",
  AUTO_ACTIVATE: "false",
};
const TOKEN_HOURS = 168;
class AppError extends Error {}
const isOn_ = (v) => v === true || v === "TRUE" || v === "true";
const clean_ = (v, n) =>
  String(v == null ? "" : v)
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, n);
const round2_ = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const phone_ = (v) =>
  String(v == null ? "" : v)
    .replace(/\D/g, "")
    .slice(-10);
