import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Cart } from '../core/cart.js';
import { Session } from '../core/session.js';
import { Toast } from '../core/toast.js';
import { $, esc, money } from '../core/dom.js';
import { icon } from '../core/icons.js';
await Layout.mount({ roles: ['CUSTOMER'], active: 'cart' });
const st = { ful: 'TAKEAWAY', pay: 'CASH', code: '', phone: Session.user.phone, address: '', note: '', q: null };
const quote = () => Api.call('quote', { outletId: Cart.data.outletId, items: Cart.lines, fulfilment: st.ful, code: st.code });
async function refresh() {
  if (!Cart.count) return empty();
  try { st.q = await quote(); } catch (e) { Toast.show(e.message); if (!st.q) return empty(e.message); }
  if (st.q.offerMsg) Toast.show(st.q.offerMsg); draw();
}
function empty(msg) { $('#app').innerHTML = `<h1>Your cart</h1><div class="empty">${esc(msg || 'Cart khaali hai.')}<br><br><a class="btn ac" href="index.html">Restaurants dekhein</a></div>`; }
function draw() {
  const q = st.q, o = q.outlet;
  $('#app').innerHTML = `<h1>Your cart</h1><div class="meta">from <b>${esc(o.name)}</b></div>
  <div class="card" style="margin-top:12px">${q.lines.map(l => `<div class="row sp" style="padding:6px 0"><div class="row" style="gap:8px"><span class="veg ${l.veg ? '' : 'nv'}"></span><span>${esc(l.name)}</span></div><div class="row"><div class="stepper-q"><button data-d="${esc(l.id)}" aria-label="Remove one ${esc(l.name)}">−</button><span>${l.qty}</span><button data-a="${esc(l.id)}" aria-label="Add one ${esc(l.name)}">+</button></div><b style="min-width:64px;text-align:right">${money(l.price * l.qty)}</b></div></div>`).join('')}</div>
  <h2>Offer code</h2><div class="row"><input id="code" placeholder="e.g. CHAI10" value="${esc(st.code)}" maxlength="15" aria-label="Offer code" style="text-transform:uppercase"><button class="btn ghost" id="apply">Apply</button></div>${q.offerCode ? `<div class="hint" style="color:var(--leaf)">${esc(q.offerCode)} applied: you save ${money(q.discount)}</div>` : ''}
  <h2>How do you want it?</h2>
  ${o.selfDelivery ? `<label class="opt"><input type="radio" name="ful" value="DELIVERY" ${st.ful === 'DELIVERY' ? 'checked' : ''}><div><b>${icon('bike')} Restaurant delivery</b><div class="meta">Restaurant ka rider ghar tak laayega · ${money(o.deliveryFee)}</div></div></label>` : ''}
  <label class="opt"><input type="radio" name="ful" value="RAPIDO" ${st.ful === 'RAPIDO' ? 'checked' : ''}><div><b>${icon('bike')} Rapido se mangwayein</b><div class="meta">Order ready hone par aap khud Rapido book karein. Koi delivery fee nahi.</div></div></label>
  <label class="opt"><input type="radio" name="ful" value="TAKEAWAY" ${st.ful === 'TAKEAWAY' ? 'checked' : ''}><div><b>${icon('bag')} Takeaway</b><div class="meta">Khud restaurant se utha lein. Koi delivery fee nahi.</div></div></label>
  <label for="ph">Contact number</label><input id="ph" inputmode="numeric" maxlength="10" value="${esc(st.phone)}">
  <h2>Payment at handoff</h2><label class="opt"><input type="radio" name="pay" value="CASH" ${st.pay === 'CASH' ? 'checked' : ''}><div><b>Cash</b><div class="meta">Pay the restaurant when you receive the order.</div></div></label><label class="opt"><input type="radio" name="pay" value="UPI_DIRECT" ${st.pay === 'UPI_DIRECT' ? 'checked' : ''}><div><b>Direct UPI</b><div class="meta">Pay the restaurant’s UPI ID/QR directly (ask the restaurant for its details). The merchant confirms receipt in the app.</div></div></label>
  ${st.ful === 'DELIVERY' ? `<label for="ad">Delivery address</label><textarea id="ad" rows="3" maxlength="250" placeholder="House no, gali, area, landmark">${esc(st.address)}</textarea>` : ''}
  <label for="nt">Note for restaurant (optional)</label><input id="nt" maxlength="200" value="${esc(st.note)}" placeholder="Kam teekha, extra chutney…">
  <h2>Bill details</h2><div class="card bill"><div><span>Item total</span><span>${money(q.subtotal)}</span></div>${q.discount ? `<div class="disc"><span>Offer discount</span><span>− ${money(q.discount)}</span></div>` : ''}<div><span>GST (${q.gstPct}%)</span><span>${money(q.gst)}</span></div><div><span>Handling fee</span><span>${money(q.handling)}</span></div>${q.fulfilment === 'DELIVERY' ? `<div><span>Delivery fee</span><span>${money(q.deliveryFee)}</span></div>` : ''}<div class="tot"><span>To pay</span><span>${money(q.total)}</span></div>
  <div class="hint">No gateway is used. Payment remains pending until the merchant confirms they received it.</div></div>
  ${q.minShort ? `<div class="banner">Is restaurant ka minimum order ${money(o.minOrder)} hai.</div>` : ''}
  <button class="btn ac block" id="place" style="margin:16px 0" ${q.minShort || !o.isOpen ? 'disabled' : ''}>${o.isOpen ? `Place order · ${money(q.total)}` : 'Restaurant abhi band hai'}</button>`;
}
const keep = () => { st.phone = $('#ph')?.value.trim() ?? st.phone; st.address = $('#ad')?.value ?? st.address; st.note = $('#nt')?.value ?? st.note; };
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return; keep();
  if (b.dataset.a || b.dataset.d) { const id = b.dataset.a || b.dataset.d; Cart.set({ id: Cart.data.outletId, name: Cart.data.outletName }, id, Cart.qty(id) + (b.dataset.a ? 1 : -1)); return refresh(); }
  if (b.id === 'apply') { st.code = $('#code').value.trim().toUpperCase(); return refresh(); }
  if (b.id === 'place') {
    try { const r = await Api.call('placeOrder', { outletId: Cart.data.outletId, items: Cart.lines, fulfilment: st.ful, paymentMethod: st.pay, code: st.code, phone: st.phone, address: st.address, note: st.note }); Cart.clear(); location.href = 'orders.html?new=' + r.id; } catch (x) { Toast.show(x.message); }
  }
});
$('#app').addEventListener('change', e => { if (e.target.name === 'ful') { keep(); st.ful = e.target.value; refresh(); } else if (e.target.name === 'pay') st.pay = e.target.value; });
if (Cart.count) { try { const first = await quote(); st.q = first; st.ful = first.outlet.selfDelivery ? 'DELIVERY' : 'RAPIDO'; } catch (e) { Toast.show(e.message); } }
refresh();
