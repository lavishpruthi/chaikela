import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { $, esc, money, dateTimeOf } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { FUL, label, tone, tracker, isOpen } from '../core/orders.js';
await Layout.mount({ roles: ['CUSTOMER'], active: 'orders' });
const fresh = new URLSearchParams(location.search).get('new');
let orders = [];
let refreshing = false;
const card = o => `<div class="card"><div class="row sp"><b>#${esc(o.id)} · ${esc(o.outletName)}</b><span class="pill ${tone(o.status)}">${esc(label(o.status, o.fulfilment))}</span></div><div class="meta">${dateTimeOf(o.created)} · ${esc(FUL[o.fulfilment])}</div>${tracker(o)}
  <div class="meta">${o.items.map(i => `${esc(i.name)} × ${i.qty}`).join(', ')}</div>
  <div class="row sp" style="margin-top:8px"><b>${money(o.total)}</b><span class="pill ${o.payment?.status === 'SUCCESS' ? 'ok' : o.payment?.status === 'CANCELLED' ? 'bad' : 'warn'}">${esc(o.payment?.method === 'UPI_DIRECT' ? 'Direct UPI' : 'Cash')} · payment ${esc((o.payment?.status || 'PENDING').toLowerCase())}</span></div>
  ${o.fulfilment === 'RAPIDO' && isOpen(o) ? `<div class="banner">Order ready hote hi Rapido book karein aur pickup address bataayein: <b>${esc(o.outletAddress)}</b> · Restaurant: ${esc(o.outletPhone)}</div>` : ''}
  ${o.fulfilment === 'TAKEAWAY' && isOpen(o) ? `<div class="banner">Pickup address: <b>${esc(o.outletAddress)}</b>. "Prepared" dikhne par le jaayein.</div>` : ''}
  <div class="row wrapx" style="margin-top:8px"><a class="btn ghost sm" href="tel:+91${esc(o.outletPhone)}">${icon('phone')} Call restaurant</a>${o.fulfilment !== 'DELIVERY' && isOpen(o) ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.outletName + ' ' + o.outletAddress)}">${icon('pin')} Directions</a>` : ''}${o.fulfilment === 'RAPIDO' && isOpen(o) ? '<a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.rapido.bike/">Rapido kholein</a>' : ''}${o.status === 'PLACED' ? `<button class="btn no sm" data-c="${esc(o.id)}">Cancel order</button>` : ''}</div></div>`;
const draw = () => { $('#app').innerHTML = `<h1>My orders</h1>${fresh ? '<div class="banner" style="background:#DDF1E4;color:#1B5A35">Order place ho gaya! Restaurant jaldi confirm karega.</div>' : ''}${orders.length ? orders.map(card).join('') : '<div class="empty">Abhi koi order nahi.</div>'}`; };
async function load(silent) { if (refreshing) return; refreshing = true; try { orders = await Api.call('myOrders', {}, { silent }); draw(); } finally { refreshing = false; } }
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('[data-c]'); if (!b || !await Modal.confirm('Cancel this order?', 'Yes, cancel')) return;
  try { await Api.call('cancelOrder', { orderId: b.dataset.c }); Toast.show('Order cancelled'); load(); } catch (x) { Toast.show(x.message); }
});
await load(false);
setInterval(() => { if (!document.hidden && orders.some(isOpen)) load(true).catch(() => {}); }, 5000);
