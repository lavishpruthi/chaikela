import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { $, esc, money, timeOf, dateTimeOf } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { FUL, label, next, tone, tracker, isOpen } from '../core/orders.js';
await Layout.mount({ roles: ['MERCHANT'], active: 'orders' });
const VERB = { PLACED: 'Accept order', CONFIRMED: 'Start preparing', PREPARING: 'Mark prepared', OUT_FOR_DELIVERY: 'Mark received' };
const verb = o => o.status === 'PREPARED' ? (o.fulfilment === 'TAKEAWAY' ? 'Mark collected' : 'Picked by delivery') : o.status === 'PICKED_UP' ? (o.fulfilment === 'RAPIDO' ? 'Mark received' : 'Out for delivery') : VERB[o.status];
let outlet = await Api.call('mOutlet'), orders = [], known = null, refreshing = false;
let view = 'live', historyRange = 'all', historyQuery = '';
const today = iso => new Date(iso).toDateString() === new Date().toDateString();
const card = (o, history = false) => `<div class="card order ${o.status === 'PLACED' ? 'new' : ''}"><div class="row sp"><b>#${esc(o.id)}</b><span class="meta">${history ? dateTimeOf(o.created) : timeOf(o.created)}</span></div>
  <div class="row wrapx" style="gap:6px;margin:4px 0"><span class="pill ${tone(o.status)}">${esc(label(o.status, o.fulfilment))}</span><span class="pill">${esc(FUL[o.fulfilment])}</span><span class="pill ${o.payment?.status === 'SUCCESS' ? 'ok' : 'warn'}">${esc((o.payment?.method || '').replaceAll('_', ' ').toLowerCase())} · ${esc((o.payment?.status || '').toLowerCase())}</span></div>
  <ul>${o.items.map(i => `<li>${esc(i.name)} × <b>${i.qty}</b></li>`).join('')}</ul>${o.note ? `<div class="meta">Note: ${esc(o.note)}</div>` : ''}
  <div class="meta">${icon('user')} ${esc(o.customerName)} · <a href="tel:+91${esc(o.customerPhone)}">${esc(o.customerPhone)}</a></div>${o.address ? `<div class="meta">${icon('pin')} ${esc(o.address)}</div>` : ''}
  <div class="row sp" style="margin-top:8px"><b>${money(o.total)}</b><div class="row">${!history && ['PLACED', 'CONFIRMED'].includes(o.status) ? `<button class="btn ghost sm" data-r="${esc(o.id)}">Reject</button>` : ''}${!history && next(o) && isOpen(o) ? `<button class="btn ok sm" data-n="${esc(o.id)}">${esc(verb(o))}</button>` : ''}${!history && o.status === 'DELIVERED' && o.payment?.status === 'PENDING' ? `<button class="btn ac sm" data-p="${esc(o.id)}">Confirm payment received</button>` : ''}</div></div>${o.status === 'PLACED' || !isOpen(o) ? '' : tracker(o)}</div>`;
const sec = (t, a) => `<h2>${t} (${a.length})</h2>${a.length ? `<div class="board">${a.map(card).join('')}</div>` : '<div class="meta">Koi order nahi.</div>'}`;
function draw() {
  const act = orders.filter(isOpen), done = orders.filter(o => !isOpen(o) && today(o.created)), paid = done.filter(o => o.status === 'DELIVERED' && o.payment?.status === 'SUCCESS');
  const history = orders.filter(o => !isOpen(o));
  const cutoff = historyRange === 'all' ? 0 : Date.now() - Number(historyRange) * 86400000;
  const shownHistory = history.filter(o => new Date(o.created).getTime() >= cutoff && `${o.id} ${o.customerName} ${o.status}`.toLowerCase().includes(historyQuery));
  $('#app').innerHTML = `<div class="row sp wrapx"><h1>${esc(outlet.name)}</h1><button class="btn ${outlet.isOpen ? 'ok' : 'ghost'}" id="open" aria-pressed="${outlet.isOpen}">${icon('power')} ${outlet.isOpen ? 'Accepting orders' : 'Closed. Tap to open'}</button></div>
  ${outlet.status !== 'active' ? '<div class="banner">Aapka restaurant abhi admin approval ke liye pending hai. Tab tak customers ko dikhega nahi. Menu add karte rahein.</div>' : ''}
  <div class="card stats"><div class="stat"><b>${act.length}</b><span class="meta">Live</span></div><div class="stat"><b>${paid.length}</b><span class="meta">Done today</span></div><div class="stat"><b>${money(paid.reduce((s, o) => s + o.total, 0))}</b><span class="meta">Sales today</span></div></div>
  <div class="tabs" role="tablist" aria-label="Orders" style="margin:14px 0"><button type="button" role="tab" data-view="live" class="${view === 'live' ? 'on' : ''}" aria-selected="${view === 'live'}">Live orders (${act.length})</button><button type="button" role="tab" data-view="history" class="${view === 'history' ? 'on' : ''}" aria-selected="${view === 'history'}">Order history (${history.length})</button></div>
  ${view === 'live' ? `${sec('New orders', act.filter(o => o.status === 'PLACED'))}${sec('In kitchen', act.filter(o => ['CONFIRMED', 'PREPARING'].includes(o.status)))}${sec('Ready & on the way', act.filter(o => ['PREPARED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)))}${sec('Finished today', done)}` : `<div class="card" style="margin-bottom:12px"><label for="historySearch">Search history</label><input id="historySearch" type="search" value="${esc(historyQuery)}" placeholder="Order number, customer, or status"><div class="chips" aria-label="History date range">${[['all','All time'],['7','7 days'],['30','30 days']].map(([v,l]) => `<button class="chip ${historyRange === v ? 'on' : ''}" type="button" data-range="${v}" aria-pressed="${historyRange === v}">${l}</button>`).join('')}</div></div>${shownHistory.length ? `<div class="board">${shownHistory.map(o => card(o, true)).join('')}</div>` : '<div class="empty">No past orders match this filter.</div>'}`}`;
}
function beep() { try { const c = new AudioContext(), o = c.createOscillator(); o.frequency.value = 880; o.connect(c.destination); o.start(); o.stop(c.currentTime + .25); } catch (e) {} navigator.vibrate?.([200, 100, 200]); }
async function load(silent) {
  if (refreshing) return; refreshing = true;
  try { orders = await Api.call('mOrders', {}, { silent }); const ids = new Set(orders.filter(o => o.status === 'PLACED').map(o => o.id));
    if (known && [...ids].some(i => !known.has(i))) { Toast.show('Naya order aaya hai!'); beep(); } known = ids; draw();
  } finally { refreshing = false; }
}
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.view) { view = b.dataset.view; draw(); }
    else if (b.dataset.range) { historyRange = b.dataset.range; draw(); }
    else if (b.id === 'open') { await Api.call('mOpen', { isOpen: !outlet.isOpen }); outlet.isOpen = !outlet.isOpen; draw(); }
    else if (b.dataset.n) { await Api.call('mAdvance', { orderId: b.dataset.n }); await load(false); }
    else if (b.dataset.p && await Modal.confirm('Confirm you received this payment in cash or directly by UPI.', 'Confirm payment')) { await Api.call('mMarkPaid', { orderId: b.dataset.p }); Toast.show('Payment marked received'); await load(false); }
    else if (b.dataset.r && await Modal.confirm('Reject this order? Customer ko cancel dikhega.', 'Reject')) { await Api.call('mReject', { orderId: b.dataset.r }); await load(false); }
  } catch (x) { Toast.show(x.message); }
});
$('#app').addEventListener('input', e => { if (e.target.id === 'historySearch') { historyQuery = e.target.value.toLowerCase(); draw(); $('#historySearch')?.focus(); $('#historySearch')?.setSelectionRange(historyQuery.length, historyQuery.length); } });
await load(false);
setInterval(() => { if (!document.hidden) load(true).catch(() => {}); }, 5000);
