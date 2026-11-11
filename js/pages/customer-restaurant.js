import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Cart } from '../core/cart.js';
import { Modal } from '../core/modal.js';
import { $, esc, money, cover } from '../core/dom.js';
import { icon } from '../core/icons.js';
await Layout.mount({ roles: ['CUSTOMER'], active: 'home' });
const { outlet, items, offers } = await Api.call('menu', { outletId: new URLSearchParams(location.search).get('id') || '' }, { auth: false });
const cats = [...new Set(items.map(i => i.category))];
function draw() {
  const sub = items.reduce((s, i) => s + Cart.qty(i.id) * i.price, 0);
  $('#app').innerHTML = `<p style="margin-top:14px"><a href="index.html">← Restaurants</a></p><h1 style="margin-top:6px">${esc(outlet.name)}</h1><div class="meta">${esc(outlet.cuisine)} · ${icon('pin')} ${esc(outlet.address)}</div>
    <div class="row wrapx" style="margin:10px 0;gap:6px"><span class="pill ${outlet.isOpen ? 'ok' : 'bad'}">${outlet.isOpen ? 'Open' : 'Closed right now'}</span><span class="pill">${icon('clock')} ~${outlet.prepMins} min</span>${outlet.selfDelivery ? `<span class="pill">${icon('bike')} Delivery ${money(outlet.deliveryFee)}</span>` : ''}<span class="pill">${icon('bag')} Takeaway</span></div>
    ${offers.map(o => `<span class="pill ac" style="margin-right:6px">${icon('tag')} ${esc(o.title)} · code ${esc(o.code)}</span>`).join('')}
    ${cats.map(c => `<h2>${esc(c)}</h2>${items.filter(i => i.category === c).map(i => `<div class="card dish" style="${i.available ? '' : 'opacity:.55'}"><div class="pics">${cover(i.photos[0], i.name)}${i.photos[1] ? cover(i.photos[1], i.name) : ''}</div><div class="grow"><div class="row" style="gap:6px"><span class="veg ${i.veg ? '' : 'nv'}" title="${i.veg ? 'Veg' : 'Non-veg'}"></span><b>${esc(i.name)}</b></div><div class="meta">${esc(i.description)}</div><div class="row sp" style="margin-top:8px"><span class="price">${money(i.price)}</span>
      ${!i.available ? '<span class="pill bad">Sold out</span>' : Cart.qty(i.id) ? `<div class="stepper-q"><button data-d="${esc(i.id)}" aria-label="Remove one ${esc(i.name)}">−</button><span aria-live="polite">${Cart.qty(i.id)}</span><button data-a="${esc(i.id)}" aria-label="Add one ${esc(i.name)}">+</button></div>` : `<button class="btn ghost sm" data-a="${esc(i.id)}" ${outlet.isOpen ? '' : 'disabled'}>Add</button>`}</div></div></div>`).join('')}`).join('') || '<div class="empty">Menu abhi add nahi hua.</div>'}
    <div style="height:70px"></div>${Cart.count && Cart.data.outletId === outlet.id ? `<a class="cartbar" href="cart.html"><span>${Cart.count} item${Cart.count > 1 ? 's' : ''} · ${money(sub)}</span><b>View cart →</b></a>` : ''}`;
}
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('[data-a],[data-d]'); if (!b) return; const id = b.dataset.a || b.dataset.d;
  if (b.dataset.a && Cart.data.outletId && Cart.data.outletId !== outlet.id && Cart.count) { if (!await Modal.confirm('Aapke cart mein dusre restaurant ke items hain. Unhe hata kar naya cart shuru karein?', 'Haan, naya cart')) return; Cart.clear(); }
  Cart.set(outlet, id, Cart.qty(id) + (b.dataset.a ? 1 : -1)); draw();
});
draw();
