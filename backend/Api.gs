/** Route table. roles: undefined = public, ['*'] = any logged-in user, or list of role codes. To add an endpoint: write a service method + add one line here. */
const ROUTES = {
  outlets: { fn: () => OutletService.list() },
  menu: { fn: (d) => OutletService.menu(d) },
  config: {
    fn: () => ({
      gstPct: Settings.num("GST_PERCENT"),
      handling: Settings.num("HANDLING_FEE"),
    }),
  },
  register: { fn: (d) => AuthService.register(d) },
  login: { fn: (d) => AuthService.login(d) },
  requestPasswordReset: { fn: (d) => AuthService.requestPasswordReset(d) },
  changePassword: {
    roles: ["*"],
    fn: (d, c) => AuthService.changePassword(d, c),
  },
  quote: { roles: ["CUSTOMER"], fn: (d) => Pricing.quote(d) },
  placeOrder: { roles: ["CUSTOMER"], fn: (d, c) => OrderService.place(d, c) },
  myOrders: { roles: ["CUSTOMER"], fn: (d, c) => OrderService.mine(c) },
  cancelOrder: { roles: ["CUSTOMER"], fn: (d, c) => OrderService.cancel(d, c) },
  mOutlet: {
    roles: ["MERCHANT"],
    fn: (d, c) => OutletService.view(OutletService.mine(c)),
  },
  mOutletSave: { roles: ["MERCHANT"], fn: (d, c) => OutletService.save(d, c) },
  mOpen: { roles: ["MERCHANT"], fn: (d, c) => OutletService.setOpen(d, c) },
  mMenu: { roles: ["MERCHANT"], fn: (d, c) => MenuService.list(c) },
  mMenuSave: { roles: ["MERCHANT"], fn: (d, c) => MenuService.save(d, c) },
  mMenuDelete: { roles: ["MERCHANT"], fn: (d, c) => MenuService.remove(d, c) },
  mOffers: { roles: ["MERCHANT"], fn: (d, c) => OfferService.list(c) },
  mOfferSave: { roles: ["MERCHANT"], fn: (d, c) => OfferService.save(d, c) },
  mOfferDelete: {
    roles: ["MERCHANT"],
    fn: (d, c) => OfferService.remove(d, c),
  },
  mOrders: { roles: ["MERCHANT"], fn: (d, c) => OrderService.forOutlet(c) },
  mAdvance: { roles: ["MERCHANT"], fn: (d, c) => OrderService.advance(d, c) },
  mMarkPaid: { roles: ["MERCHANT"], fn: (d, c) => OrderService.markPaid(d, c) },
  mReject: { roles: ["MERCHANT"], fn: (d, c) => OrderService.reject(d, c) },
  aOutlets: { roles: ["ADMIN"], fn: () => AdminService.outlets() },
  aOutletSet: { roles: ["ADMIN"], fn: (d) => AdminService.setOutlet(d) },
  aOrders: { roles: ["ADMIN"], fn: () => AdminService.orders() },
  aUsers: { roles: ["ADMIN"], fn: () => AdminService.users() },
  aPasswordResets: {
    roles: ["ADMIN"],
    fn: () => AdminService.passwordResets(),
  },
  aResetPassword: {
    roles: ["ADMIN"],
    fn: (d) => AdminService.resetPassword(d),
  },
  aUserSet: { roles: ["ADMIN"], fn: (d, c) => AdminService.setUser(d, c) },
  aSettings: { roles: ["ADMIN"], fn: () => Settings.all() },
  aSettingsSave: { roles: ["ADMIN"], fn: (d) => Settings.save(d.values || {}) },
};
const READ_ONLY_ACTIONS = new Set(["myOrders", "mOrders"]);
function dispatch_(action, d) {
  const r = ROUTES[action];
  if (!r) throw new AppError("Unknown action");
  return r.fn(d, r.roles ? Auth.user(d.token, r.roles) : null);
}
function respond_(fn) {
  let body;
  try {
    body = { ok: true, data: fn() };
  } catch (e) {
    if (!(e instanceof AppError)) console.error(e.stack || e);
    body = {
      ok: false,
      error:
        e instanceof AppError
          ? e.message
          : "Something went wrong. Please try again.",
    };
  }
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
function doGet(e) {
  return respond_(() => dispatch_(e.parameter.action, e.parameter));
}
function doPost(e) {
  return respond_(() => {
    const d = JSON.parse(e.postData.contents);
    if (READ_ONLY_ACTIONS.has(d.action)) return dispatch_(d.action, d);
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      return dispatch_(d.action, d);
    } finally {
      lock.releaseLock();
    }
  });
}
