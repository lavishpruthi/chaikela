/** Single-restaurant cart kept in localStorage: {outletId, outletName, items:{itemId:qty}} */
export class Cart {
  static get data() { try { return JSON.parse(localStorage.getItem('ck_cart')) || { outletId: '', outletName: '', items: {} }; } catch (e) { return { outletId: '', outletName: '', items: {} }; } }
  static save(d) { localStorage.setItem('ck_cart', JSON.stringify(d)); dispatchEvent(new Event('cartchange')); }
  static get count() { return Object.values(Cart.data.items).reduce((a, b) => a + b, 0); }
  static qty(id) { return Cart.data.items[id] || 0; }
  static set(outlet, id, q) { let d = Cart.data; if (d.outletId !== outlet.id) d = { outletId: outlet.id, outletName: outlet.name, items: {} }; if (q > 0) d.items[id] = Math.min(q, 50); else delete d.items[id]; if (!Object.keys(d.items).length) d = { outletId: '', outletName: '', items: {} }; Cart.save(d); }
  static clear() { Cart.save({ outletId: '', outletName: '', items: {} }); }
  static get lines() { return Object.entries(Cart.data.items).map(([id, qty]) => ({ id, qty })); }
}
