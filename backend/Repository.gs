/** Sheet-backed repository. Ids are sequential and human readable: prefix + number starting at 101 (U101, JIND-101, O101...). */
class Repository {
  constructor(sheetName, headers, prefix, textCols) {
    this.sheetName = sheetName;
    this.headers = headers;
    this.prefix = prefix;
    this.textCols = textCols || [];
  }
  get sheet() {
    const ss = SpreadsheetApp.getActive();
    let s = ss.getSheetByName(this.sheetName);
    if (!s) {
      s = ss.insertSheet(this.sheetName);
      s.appendRow(this.headers);
      s.setFrozenRows(1);
      s.getRange(1, 1, 1, this.headers.length).setFontWeight("bold");
      this.textCols.forEach((c) =>
        s.getRange(1, c, s.getMaxRows(), 1).setNumberFormat("@"),
      );
    }
    return s;
  }
  all() {
    const v = this.sheet.getDataRange().getValues();
    v.shift();
    return v.map((r, i) => {
      const o = { _row: i + 2 };
      this.headers.forEach((h, j) => (o[h] = r[j]));
      return o;
    });
  }
  find(id) {
    return this.all().find((r) => String(r.id) === String(id)) || null;
  }
  nextId() {
    const n = this.all().reduce(
      (m, r) => Math.max(m, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0),
      100,
    );
    return this.prefix + (n + 1);
  }
  insert(o) {
    const now = new Date().toISOString();
    o.id = o.id || this.nextId();
    o.created = now;
    o.updated = now;
    this.sheet.appendRow(this.headers.map((h) => (o[h] == null ? "" : o[h])));
    return o;
  }
  update(id, patch) {
    const r = this.find(id);
    if (!r) throw new AppError("Record not found");
    const rec = Object.assign({}, r, patch, {
      updated: new Date().toISOString(),
    });
    this.sheet
      .getRange(r._row, 1, 1, this.headers.length)
      .setValues([this.headers.map((h) => (rec[h] == null ? "" : rec[h]))]);
    return rec;
  }
  remove(id) {
    const r = this.find(id);
    if (!r) throw new AppError("Record not found");
    this.sheet.deleteRow(r._row);
  }
}
class RoleRepo extends Repository {
  constructor() {
    super("Roles", ["id", "code", "name", "created", "updated"], "R");
  }
}
class UserRepo extends Repository {
  constructor() {
    super(
      "Users",
      [
        "id",
        "name",
        "phone",
        "roleId",
        "pwHash",
        "status",
        "created",
        "updated",
      ],
      "U",
      [3],
    );
  }
}
class PasswordResetRepo extends Repository {
  constructor() {
    super(
      "PasswordResets",
      ["id", "phone", "status", "created", "updated"],
      "PR",
      [2],
    );
  }
}
class OutletRepo extends Repository {
  constructor() {
    super(
      "Outlets",
      [
        "id",
        "ownerId",
        "name",
        "description",
        "cuisine",
        "address",
        "phone",
        "photo",
        "status",
        "isOpen",
        "selfDelivery",
        "deliveryFee",
        "minOrder",
        "prepMins",
        "plan",
        "paidTill",
        "created",
        "updated",
      ],
      "JIND-",
      [7],
    );
  }
}
class MenuRepo extends Repository {
  constructor() {
    super(
      "MenuItems",
      [
        "id",
        "outletId",
        "name",
        "description",
        "category",
        "price",
        "veg",
        "photo1",
        "photo2",
        "available",
        "created",
        "updated",
      ],
      "M",
    );
  }
}
class OfferRepo extends Repository {
  constructor() {
    super(
      "Offers",
      [
        "id",
        "outletId",
        "title",
        "code",
        "type",
        "value",
        "maxOff",
        "minOrder",
        "validTill",
        "active",
        "created",
        "updated",
      ],
      "F",
    );
  }
}
class OrderRepo extends Repository {
  constructor() {
    super(
      "Orders",
      [
        "id",
        "outletId",
        "customerId",
        "customerName",
        "customerPhone",
        "fulfilment",
        "address",
        "note",
        "items",
        "subtotal",
        "discount",
        "offerCode",
        "gst",
        "handling",
        "deliveryFee",
        "total",
        "status",
        "history",
        "created",
        "updated",
      ],
      "O",
      [5],
    );
  }
}
class PaymentRepo extends Repository {
  constructor() {
    super(
      "Payments",
      ["id", "orderId", "amount", "method", "status", "created", "updated"],
      "P",
    );
  }
}
