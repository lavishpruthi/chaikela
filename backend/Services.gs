/** Business logic. Stateless classes; repositories do the I/O. No '#' private members (Apps Script parser rejects them). */
class Settings {
  static sheet_() {
    const ss = SpreadsheetApp.getActive();
    let s = ss.getSheetByName("Settings");
    if (!s) {
      s = ss.insertSheet("Settings");
      s.appendRow(["key", "value"]);
      Object.keys(DEFAULT_SETTINGS).forEach((k) =>
        s.appendRow([k, DEFAULT_SETTINGS[k]]),
      );
      s.setFrozenRows(1);
    }
    return s;
  }
  static all() {
    const c = CacheService.getScriptCache(),
      hit = c.get("settings");
    if (hit) return JSON.parse(hit);
    const out = Object.assign({}, DEFAULT_SETTINGS);
    Settings.sheet_()
      .getDataRange()
      .getValues()
      .slice(1)
      .forEach((r) => {
        if (r[0]) out[String(r[0])] = String(r[1]);
      });
    c.put("settings", JSON.stringify(out), 300);
    return out;
  }
  static num(k) {
    return Number(Settings.all()[k]) || 0;
  }
  static save(values) {
    const s = Settings.sheet_(),
      rows = s.getDataRange().getValues();
    Object.keys(values)
      .filter((k) => k in DEFAULT_SETTINGS)
      .forEach((k) => {
        const v = String(values[k]).trim();
        if (k !== "AUTO_ACTIVATE" && !(Number(v) >= 0))
          throw new AppError(k + " must be a number");
        const i = rows.findIndex((r, ix) => ix > 0 && r[0] === k);
        if (i > 0) s.getRange(i + 1, 2).setValue(v);
        else s.appendRow([k, v]);
      });
    CacheService.getScriptCache().remove("settings");
    return Settings.all();
  }
}
class Media {
  /** Converts data: URLs to Drive files and returns public image URLs; existing URLs pass through. Drive is touched only when a new image is uploaded. */
  static save(arr, tag) {
    let folder = null;
    return (arr || []).map((p, i) => {
      if (!p) return "";
      if (String(p).indexOf("data:image/") !== 0) return String(p);
      if (!folder) {
        const it = DriveApp.getFoldersByName("Chaikela Photos");
        folder = it.hasNext()
          ? it.next()
          : DriveApp.createFolder("Chaikela Photos");
      }
      const f = folder.createFile(
        Utilities.newBlob(
          Utilities.base64Decode(p.split(",")[1]),
          "image/jpeg",
          tag + "_" + Date.now() + "_" + i + ".jpg",
        ),
      );
      f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return "https://lh3.googleusercontent.com/d/" + f.getId();
    });
  }
}
class AuthService {
  static requestPasswordReset(d) {
    const phone = phone_(d.phone);
    if (!/^[6-9]\d{9}$/.test(phone))
      throw new AppError("Enter a valid 10-digit mobile number");
    const cache = CacheService.getScriptCache(),
      key = "pwreset:" + phone;
    if (!cache.get(key)) {
      const user = new UserRepo()
        .all()
        .find((u) => String(u.phone) === phone && u.status === "active");
      if (user) {
        const repo = new PasswordResetRepo();
        if (
          !repo
            .all()
            .some((r) => String(r.phone) === phone && r.status === "pending")
        )
          repo.insert({ phone, status: "pending" });
      }
      cache.put(key, "1", 600);
    }
    return {
      message:
        "If an active account matches that number, a reset request has been sent to the admin.",
    };
  }
  static profile(u) {
    return {
      id: u.id,
      name: u.name,
      phone: String(u.phone),
      role: Auth.roleCode(u.roleId),
    };
  }
  static register(d) {
    const role = d.role === "MERCHANT" ? "MERCHANT" : "CUSTOMER",
      name = clean_(d.name, 60),
      phone = phone_(d.phone),
      o = d.outlet || {};
    if (!name) throw new AppError("Please enter your name");
    if (!/^[6-9]\d{9}$/.test(phone))
      throw new AppError("Enter a valid 10-digit mobile number");
    if (String(d.password || "").length < 6)
      throw new AppError("Password must be at least 6 characters");
    if (role === "MERCHANT" && (!clean_(o.name, 80) || !clean_(o.address, 200)))
      throw new AppError("Restaurant name and address are required");
    const users = new UserRepo();
    if (users.all().some((u) => String(u.phone) === phone))
      throw new AppError("This number is already registered. Please log in.");
    const u = users.insert({
      name,
      phone,
      roleId: ROLES[role],
      pwHash: Auth.hash(String(d.password), phone),
      status: "active",
    });
    if (role === "MERCHANT") {
      new OutletRepo().insert({
        ownerId: u.id,
        name: clean_(o.name, 80),
        description: clean_(o.description, 400),
        cuisine: clean_(o.cuisine, 80),
        address: clean_(o.address, 200),
        phone: phone_(o.phone) || phone,
        photo: "",
        status: Settings.all().AUTO_ACTIVATE === "true" ? "active" : "inactive",
        isOpen: true,
        selfDelivery: true,
        deliveryFee: "",
        minOrder: 0,
        prepMins: 20,
        plan: "FREE",
        paidTill: "",
      });
    }
    return { token: Auth.sign(u.id), profile: AuthService.profile(u) };
  }
  static login(d) {
    const phone = phone_(d.phone),
      u = new UserRepo().all().find((x) => String(x.phone) === phone);
    if (
      !u ||
      u.status !== "active" ||
      u.pwHash !== Auth.hash(String(d.password || ""), phone)
    ) {
      Utilities.sleep(1200);
      throw new AppError("Wrong mobile number or password");
    }
    const p = AuthService.profile(u);
    if (d.role && d.role !== p.role)
      throw new AppError(
        p.role === "MERCHANT"
          ? "This is a Merchant account. Use the Merchant tab."
          : p.role === "CUSTOMER"
            ? "This is a Customer account. Use the Customer tab."
            : "Use the Admin login link.",
      );
    return { token: Auth.sign(u.id), profile: p };
  }
  static changePassword(d, ctx) {
    const user = ctx.user,
      current = String(d.currentPassword || ""),
      next = String(d.newPassword || ""),
      confirm = String(d.confirmPassword || "");
    if (!current || !next || !confirm)
      throw new AppError("Current password and new password are required");
    if (user.pwHash !== Auth.hash(current, String(user.phone)))
      throw new AppError("Current password is incorrect");
    if (next.length < 6)
      throw new AppError("New password must be at least 6 characters");
    if (next !== confirm)
      throw new AppError("New password and confirmation do not match");
    if (current === next)
      throw new AppError(
        "Choose a new password different from the current one",
      );
    new UserRepo().update(user.id, {
      pwHash: Auth.hash(next, String(user.phone)),
    });
    return { message: "Password changed successfully." };
  }
}
class OutletService {
  static mine(ctx) {
    const o = new OutletRepo().all().find((x) => x.ownerId === ctx.user.id);
    if (!o) throw new AppError("Restaurant not found");
    return o;
  }
  static view(o) {
    const c = Object.assign({}, o);
    delete c._row;
    ["isOpen", "selfDelivery"].forEach((k) => (c[k] = isOn_(c[k])));
    c.phone = String(c.phone);
    return c;
  }
  static pub(o, offers) {
    const of = offers.find((f) => f.outletId === o.id && isOn_(f.active));
    return {
      id: o.id,
      name: o.name,
      description: o.description,
      cuisine: o.cuisine,
      address: o.address,
      phone: String(o.phone),
      photo: o.photo,
      isOpen: isOn_(o.isOpen),
      selfDelivery: isOn_(o.selfDelivery),
      deliveryFee:
        o.deliveryFee === ""
          ? Settings.num("DELIVERY_FEE")
          : Number(o.deliveryFee),
      minOrder: Number(o.minOrder) || 0,
      prepMins: Number(o.prepMins) || 20,
      offer: of ? { title: of.title, code: of.code } : null,
    };
  }
  static list() {
    const c = CacheService.getScriptCache(),
      hit = c.get("outlets");
    if (hit) return JSON.parse(hit);
    const offers = new OfferRepo().all(),
      out = new OutletRepo()
        .all()
        .filter((o) => o.status === "active")
        .map((o) => OutletService.pub(o, offers));
    c.put("outlets", JSON.stringify(out), 60);
    return out;
  }
  static menu(d) {
    const o = new OutletRepo().find(d.outletId);
    if (!o || o.status !== "active")
      throw new AppError("Restaurant not available");
    const offers = new OfferRepo()
      .all()
      .filter((f) => f.outletId === o.id && isOn_(f.active));
    const items = new MenuRepo()
      .all()
      .filter((m) => m.outletId === o.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category || "Others",
        price: Number(m.price),
        veg: isOn_(m.veg),
        photos: [m.photo1, m.photo2].filter(Boolean),
        available: isOn_(m.available),
      }));
    return {
      outlet: OutletService.pub(o, offers),
      items,
      offers: offers.map((f) => ({ title: f.title, code: f.code })),
    };
  }
  static save(d, ctx) {
    const o = OutletService.mine(ctx),
      name = clean_(d.name, 80),
      phone = phone_(d.phone);
    if (!name || !clean_(d.address, 200))
      throw new AppError("Name and address are required");
    if (!/^[6-9]\d{9}$/.test(phone))
      throw new AppError("Enter a valid contact number");
    const fee =
      String(d.deliveryFee).trim() === ""
        ? ""
        : Math.max(0, Number(d.deliveryFee) || 0);
    new OutletRepo().update(o.id, {
      name,
      description: clean_(d.description, 400),
      cuisine: clean_(d.cuisine, 80),
      address: clean_(d.address, 200),
      phone,
      photo: d.photo ? Media.save([d.photo], o.id)[0] : "",
      selfDelivery: !!d.selfDelivery,
      deliveryFee: fee,
      minOrder: Math.max(0, Number(d.minOrder) || 0),
      prepMins: Math.min(180, Math.max(5, Number(d.prepMins) || 20)),
    });
    CacheService.getScriptCache().remove("outlets");
    return true;
  }
  static setOpen(d, ctx) {
    const o = OutletService.mine(ctx);
    new OutletRepo().update(o.id, { isOpen: !!d.isOpen });
    CacheService.getScriptCache().remove("outlets");
    return true;
  }
}
class MenuService {
  static list(ctx) {
    const o = OutletService.mine(ctx);
    return new MenuRepo()
      .all()
      .filter((m) => m.outletId === o.id)
      .map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        category: m.category,
        price: Number(m.price),
        veg: isOn_(m.veg),
        photo1: m.photo1,
        photo2: m.photo2,
        available: isOn_(m.available),
      }));
  }
  static save(d, ctx) {
    const o = OutletService.mine(ctx),
      repo = new MenuRepo(),
      name = clean_(d.name, 80),
      price = Number(d.price);
    if (!name) throw new AppError("Dish name is required");
    if (!(price > 0 && price <= 10000))
      throw new AppError("Enter a valid price");
    const cur = d.id ? repo.find(d.id) : null;
    if (d.id && (!cur || cur.outletId !== o.id))
      throw new AppError("Dish not found");
    const ph = Media.save([d.photo1, d.photo2], o.id);
    const rec = {
      name,
      description: clean_(d.description, 300),
      category: clean_(d.category, 40) || "Others",
      price: round2_(price),
      veg: !!d.veg,
      photo1: ph[0] || "",
      photo2: ph[1] || "",
      available: !!d.available,
    };
    if (cur) repo.update(cur.id, rec);
    else repo.insert(Object.assign({ outletId: o.id }, rec));
    return true;
  }
  static remove(d, ctx) {
    const o = OutletService.mine(ctx),
      m = new MenuRepo().find(d.id);
    if (!m || m.outletId !== o.id) throw new AppError("Dish not found");
    new MenuRepo().remove(d.id);
    return true;
  }
}
class OfferService {
  static list(ctx) {
    const o = OutletService.mine(ctx);
    return new OfferRepo()
      .all()
      .filter((f) => f.outletId === o.id)
      .map((f) => ({
        id: f.id,
        title: f.title,
        code: f.code,
        type: f.type,
        value: Number(f.value),
        maxOff: Number(f.maxOff) || 0,
        minOrder: Number(f.minOrder) || 0,
        validTill: f.validTill
          ? Utilities.formatDate(
              new Date(f.validTill),
              "Asia/Kolkata",
              "yyyy-MM-dd",
            )
          : "",
        active: isOn_(f.active),
      }));
  }
  static save(d, ctx) {
    const o = OutletService.mine(ctx),
      repo = new OfferRepo(),
      code = clean_(d.code, 15).toUpperCase(),
      type = d.type === "FLAT" ? "FLAT" : "PERCENT",
      value = Number(d.value);
    if (!clean_(d.title, 60)) throw new AppError("Offer title is required");
    if (!/^[A-Z0-9]{3,15}$/.test(code))
      throw new AppError("Code: 3–15 letters or digits");
    if (!(value > 0) || (type === "PERCENT" && value > 100))
      throw new AppError("Enter a valid offer value");
    const all = repo.all().filter((f) => f.outletId === o.id);
    if (all.some((f) => String(f.code).toUpperCase() === code && f.id !== d.id))
      throw new AppError("This code already exists");
    const cur = d.id ? all.find((f) => f.id === d.id) : null;
    if (d.id && !cur) throw new AppError("Offer not found");
    const rec = {
      title: clean_(d.title, 60),
      code,
      type,
      value,
      maxOff: Number(d.maxOff) || 0,
      minOrder: Number(d.minOrder) || 0,
      validTill: clean_(d.validTill, 10),
      active: !!d.active,
    };
    if (cur) repo.update(cur.id, rec);
    else repo.insert(Object.assign({ outletId: o.id }, rec));
    CacheService.getScriptCache().remove("outlets");
    return true;
  }
  static remove(d, ctx) {
    const o = OutletService.mine(ctx),
      f = new OfferRepo().find(d.id);
    if (!f || f.outletId !== o.id) throw new AppError("Offer not found");
    new OfferRepo().remove(d.id);
    CacheService.getScriptCache().remove("outlets");
    return true;
  }
}
class Pricing {
  /** Single source of truth for totals. The client only sends item ids + quantities. */
  static quote(d) {
    const outlet = new OutletRepo().find(d.outletId);
    if (!outlet || outlet.status !== "active")
      throw new AppError("This restaurant is not available right now");
    const ful = d.fulfilment;
    if (!FLOW[ful]) throw new AppError("Choose delivery, Rapido or takeaway");
    if (ful === "DELIVERY" && !isOn_(outlet.selfDelivery))
      throw new AppError(
        "This restaurant does not deliver. Choose Rapido or takeaway.",
      );
    const menu = {};
    new MenuRepo()
      .all()
      .filter((m) => m.outletId === outlet.id)
      .forEach((m) => (menu[m.id] = m));
    const lines = (d.items || [])
      .map((i) => {
        const q = Math.min(Math.max(parseInt(i.qty, 10) || 0, 0), 50);
        if (!q) return null;
        const m = menu[i.id];
        if (!m || !isOn_(m.available))
          throw new AppError(
            (m ? m.name : "An item") + " is not available right now",
          );
        return {
          id: m.id,
          name: m.name,
          price: Number(m.price),
          qty: q,
          veg: isOn_(m.veg),
        };
      })
      .filter(Boolean);
    if (!lines.length) throw new AppError("Your cart is empty");
    const subtotal = round2_(lines.reduce((s, l) => s + l.price * l.qty, 0));
    let discount = 0,
      offerCode = "",
      offerMsg = "";
    if (d.code) {
      const code = clean_(d.code, 15).toUpperCase(),
        of = new OfferRepo()
          .all()
          .find(
            (f) =>
              f.outletId === outlet.id &&
              String(f.code).toUpperCase() === code &&
              isOn_(f.active),
          );
      if (!of) offerMsg = "Invalid offer code";
      else if (
        of.validTill &&
        new Date(of.validTill).getTime() + 86400000 < Date.now()
      )
        offerMsg = "This offer has expired";
      else if (subtotal < Number(of.minOrder || 0))
        offerMsg =
          "Add items worth ₹" + of.minOrder + " or more to use this offer";
      else {
        discount =
          of.type === "PERCENT"
            ? (subtotal * Number(of.value)) / 100
            : Number(of.value);
        if (of.type === "PERCENT" && Number(of.maxOff) > 0)
          discount = Math.min(discount, Number(of.maxOff));
        discount = round2_(Math.min(discount, subtotal));
        offerCode = code;
      }
    }
    const taxable = subtotal - discount,
      gstPct = Settings.num("GST_PERCENT"),
      gst = round2_((taxable * gstPct) / 100),
      handling = Settings.num("HANDLING_FEE");
    const pub = OutletService.pub(outlet, []),
      deliveryFee = ful === "DELIVERY" ? pub.deliveryFee : 0;
    return {
      outlet: pub,
      fulfilment: ful,
      lines,
      subtotal,
      discount,
      offerCode,
      offerMsg,
      gstPct,
      gst,
      handling,
      deliveryFee,
      total: round2_(taxable + gst + handling + deliveryFee),
      minShort: subtotal < pub.minOrder,
    };
  }
}
class OrderService {
  static view(o, pay, outlet) {
    let items = [],
      history = [];
    try {
      items = JSON.parse(o.items);
      history = JSON.parse(o.history);
    } catch (e) {}
    return {
      id: o.id,
      outletId: o.outletId,
      outletName: outlet ? outlet.name : "",
      outletPhone: outlet ? String(outlet.phone) : "",
      outletAddress: outlet ? outlet.address : "",
      customerName: o.customerName,
      customerPhone: String(o.customerPhone),
      fulfilment: o.fulfilment,
      address: o.address,
      note: o.note,
      items,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      offerCode: o.offerCode,
      gst: Number(o.gst),
      handling: Number(o.handling),
      deliveryFee: Number(o.deliveryFee),
      total: Number(o.total),
      status: o.status,
      history,
      created: o.created,
      payment: pay ? { method: pay.method, status: pay.status } : null,
    };
  }
  static place(d, ctx) {
    const q = Pricing.quote(d),
      outlet = new OutletRepo().find(d.outletId),
      phone = phone_(d.phone) || phone_(ctx.user.phone),
      address = clean_(d.address, 250);
    if (!isOn_(outlet.isOpen))
      throw new AppError("This restaurant is closed right now");
    if (q.minShort)
      throw new AppError(
        "Minimum order for this restaurant is ₹" + q.outlet.minOrder,
      );
    if (!/^[6-9]\d{9}$/.test(phone))
      throw new AppError("Enter a valid contact number");
    if (q.fulfilment === "DELIVERY" && address.length < 8)
      throw new AppError("Enter your full delivery address");
    const now = new Date().toISOString();
    const o = new OrderRepo().insert({
      outletId: outlet.id,
      customerId: ctx.user.id,
      customerName: ctx.user.name,
      customerPhone: phone,
      fulfilment: q.fulfilment,
      address,
      note: clean_(d.note, 200),
      items: JSON.stringify(q.lines),
      subtotal: q.subtotal,
      discount: q.discount,
      offerCode: q.offerCode,
      gst: q.gst,
      handling: q.handling,
      deliveryFee: q.deliveryFee,
      total: q.total,
      status: "PLACED",
      history: JSON.stringify([{ s: "PLACED", t: now }]),
    });
    new PaymentRepo().insert({
      orderId: o.id,
      amount: q.total,
      method: d.paymentMethod === "UPI_DIRECT" ? "UPI_DIRECT" : "CASH",
      status: "PENDING",
    });
    return { id: o.id };
  }
  static maps_() {
    const outlets = {},
      pays = {};
    new OutletRepo().all().forEach((x) => (outlets[x.id] = x));
    new PaymentRepo().all().forEach((p) => (pays[p.orderId] = p));
    return { outlets, pays };
  }
  static mine(ctx) {
    const m = OrderService.maps_();
    return new OrderRepo()
      .all()
      .filter((o) => o.customerId === ctx.user.id)
      .reverse()
      .slice(0, 50)
      .map((o) => OrderService.view(o, m.pays[o.id], m.outlets[o.outletId]));
  }
  static setStatus_(o, status, note) {
    const h = JSON.parse(o.history || "[]");
    h.push({ s: status, t: new Date().toISOString(), n: note || "" });
    new OrderRepo().update(o.id, { status, history: JSON.stringify(h) });
    const p = new PaymentRepo().all().find((x) => x.orderId === o.id);
    if (p && status === "CANCELLED")
      new PaymentRepo().update(p.id, { status: "CANCELLED" });
  }
  static cancel(d, ctx) {
    const o = new OrderRepo().find(d.orderId);
    if (!o || o.customerId !== ctx.user.id)
      throw new AppError("Order not found");
    if (o.status !== "PLACED")
      throw new AppError(
        "The restaurant has already accepted this order. Please call them to cancel.",
      );
    OrderService.setStatus_(o, "CANCELLED", "Cancelled by customer");
    return true;
  }
  static forOutlet(ctx) {
    const out = OutletService.mine(ctx),
      m = OrderService.maps_();
    return new OrderRepo()
      .all()
      .filter((o) => o.outletId === out.id)
      .reverse()
      .map((o) => OrderService.view(o, m.pays[o.id], out));
  }
  static owned_(d, ctx) {
    const out = OutletService.mine(ctx),
      o = new OrderRepo().find(d.orderId);
    if (!o || o.outletId !== out.id) throw new AppError("Order not found");
    return o;
  }
  static advance(d, ctx) {
    const o = OrderService.owned_(d, ctx),
      flow = FLOW[o.fulfilment],
      i = flow.indexOf(o.status);
    if (i < 0 || i >= flow.length - 1)
      throw new AppError("This order is already closed");
    OrderService.setStatus_(o, flow[i + 1]);
    return flow[i + 1];
  }
  static markPaid(d, ctx) {
    const o = OrderService.owned_(d, ctx);
    if (o.status !== "DELIVERED")
      throw new AppError("Confirm payment after the order is handed over");
    const payments = new PaymentRepo(),
      payment = payments.all().find((p) => p.orderId === o.id);
    if (!payment || payment.status !== "PENDING")
      throw new AppError("Payment is already settled");
    payments.update(payment.id, { status: "SUCCESS" });
    return true;
  }
  static reject(d, ctx) {
    const o = OrderService.owned_(d, ctx);
    if (!["PLACED", "CONFIRMED"].includes(o.status))
      throw new AppError("Too late to reject this order");
    OrderService.setStatus_(
      o,
      "CANCELLED",
      clean_(d.reason, 100) || "Rejected by restaurant",
    );
    return true;
  }
}
class AdminService {
  static passwordResets() {
    const users = {};
    new UserRepo().all().forEach((u) => (users[u.phone] = u));
    return new PasswordResetRepo()
      .all()
      .reverse()
      .slice(0, 100)
      .map((r) => ({
        id: r.id,
        phone: String(r.phone),
        status: r.status,
        created: r.created,
        name: users[r.phone] ? users[r.phone].name : "",
      }));
  }
  static resetPassword(d) {
    const resets = new PasswordResetRepo(),
      request = resets.find(d.id);
    if (!request || request.status !== "pending")
      throw new AppError("Reset request is no longer pending");
    const phone = String(request.phone),
      users = new UserRepo();
    const user = users
      .all()
      .find((u) => String(u.phone) === phone && u.status === "active");
    if (!user) throw new AppError("Active user account not found");
    const seed = Utilities.getUuid().replace(/-/g, "").toUpperCase();
    const password =
      "A" + (parseInt(seed.slice(0, 2), 16) % 10) + seed.slice(2, 8);
    users.update(user.id, { pwHash: Auth.hash(password, phone) });
    resets.update(request.id, { status: "generated" });
    return { phone, name: user.name, password };
  }
  static outlets() {
    const users = {};
    new UserRepo().all().forEach((u) => (users[u.id] = u));
    const count = {};
    new OrderRepo()
      .all()
      .forEach((o) => (count[o.outletId] = (count[o.outletId] || 0) + 1));
    return new OutletRepo().all().map((o) =>
      Object.assign(OutletService.view(o), {
        ownerName: users[o.ownerId] ? users[o.ownerId].name : "",
        ownerPhone: users[o.ownerId] ? String(users[o.ownerId].phone) : "",
        orders: count[o.id] || 0,
      }),
    );
  }
  static setOutlet(d) {
    if (!["active", "inactive"].includes(d.status))
      throw new AppError("Invalid status");
    new OutletRepo().update(d.id, { status: d.status });
    CacheService.getScriptCache().remove("outlets");
    return true;
  }
  static orders() {
    const m = OrderService.maps_();
    return new OrderRepo()
      .all()
      .reverse()
      .slice(0, 150)
      .map((o) => OrderService.view(o, m.pays[o.id], m.outlets[o.outletId]));
  }
  static users() {
    return new UserRepo().all().map((u) => ({
      id: u.id,
      name: u.name,
      phone: String(u.phone),
      role: Auth.roleCode(u.roleId),
      status: u.status,
      created: u.created,
    }));
  }
  static setUser(d, ctx) {
    if (d.id === ctx.user.id)
      throw new AppError("You cannot disable your own account");
    new UserRepo().update(d.id, {
      status: d.status === "disabled" ? "disabled" : "active",
    });
    return true;
  }
}
