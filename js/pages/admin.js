import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { Fields } from '../core/fields.js';
import { $, esc, money, dateTimeOf } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { FUL, label, tone } from '../core/orders.js';
await Layout.mount({ roles: ['ADMIN'] });
const TABS = [['outlets', 'Restaurants', 'store'], ['orders', 'Orders', 'receipt'], ['users', 'Users', 'user'], ['resets', 'Password resets', 'key'], ['settings', 'Fees & settings', 'settings']];
let tab = 'outlets', data = [];
const table = (head, rows) => `<div class="tbl"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length}" class="meta">Nothing yet.</td></tr>`}</tbody></table></div>`;
const VIEW = {
  outlets: () => table(['ID', 'Restaurant', 'Owner', 'Orders', 'Plan', 'Status', ''], data.map((o, i) => `<tr><td>${esc(o.id)}</td><td><b>${esc(o.name)}</b><div class="meta">${esc(o.address)}</div></td><td>${esc(o.ownerName)}<div class="meta">${esc(o.ownerPhone)}</div></td><td>${o.orders}</td><td>${esc(o.plan)}</td><td><span class="pill ${o.status === 'active' ? 'ok' : 'warn'}">${esc(o.status)}</span></td><td><button class="btn sm ${o.status === 'active' ? 'no' : 'ok'}" data-o="${i}">${o.status === 'active' ? 'Deactivate' : 'Activate'}</button></td></tr>`)),
  orders: () => table(['Order', 'Restaurant', 'Customer', 'Type', 'Total', 'Status', 'Payment'], data.map(o => `<tr><td>${esc(o.id)}<div class="meta">${dateTimeOf(o.created)}</div></td><td>${esc(o.outletName)}</td><td>${esc(o.customerName)}<div class="meta">${esc(o.customerPhone)}</div></td><td>${esc(FUL[o.fulfilment])}</td><td>${money(o.total)}</td><td><span class="pill ${tone(o.status)}">${esc(label(o.status, o.fulfilment))}</span></td><td>${esc(o.payment?.status || '')}</td></tr>`)),
  users: () => table(['ID', 'Name', 'Mobile', 'Role', 'Status', ''], data.map((u, i) => `<tr><td>${esc(u.id)}</td><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.role)}</td><td><span class="pill ${u.status === 'active' ? 'ok' : 'bad'}">${esc(u.status)}</span></td><td>${u.role === 'ADMIN' ? '' : `<button class="btn sm ghost" data-u="${i}">${u.status === 'active' ? 'Disable' : 'Enable'}</button>`}</td></tr>`)),
  resets: () => table(['Name', 'Mobile', 'Requested', 'Status', ''], data.map((r, i) => `<tr><td>${esc(r.name || 'User')}</td><td>${esc(r.phone)}</td><td>${dateTimeOf(r.created)}</td><td><span class="pill ${r.status === 'pending' ? 'warn' : 'ok'}">${esc(r.status)}</span></td><td>${r.status === 'pending' ? `<button class="btn sm ac" data-reset="${i}">Generate &amp; WhatsApp</button>` : ''}</td></tr>`)),
  settings: () => `<form id="sf" class="card" novalidate>${Fields.render(SF, { ...data, AUTO_ACTIVATE: data.AUTO_ACTIVATE === 'true' })}<p class="hint">Ye fees naye orders par lagengi. Handling fee aapki kamai hai. Restaurant se commission nahi.</p><button class="btn ac block" style="margin-top:14px">Save settings</button></form>`
};
const SF = [{ key: 'GST_PERCENT', label: 'GST on food (%)', type: 'number', max: 5, required: true }, { key: 'HANDLING_FEE', label: 'Handling fee per order (₹)', type: 'number', max: 5, required: true }, { key: 'DELIVERY_FEE', label: 'Default delivery fee (₹)', type: 'number', max: 5, required: true }, { key: 'AUTO_ACTIVATE', label: 'Auto-activate new restaurants (skip approval)', type: 'toggle' }];
const API = { outlets: 'aOutlets', orders: 'aOrders', users: 'aUsers', resets: 'aPasswordResets', settings: 'aSettings' };
async function load() {
  data = await Api.call(API[tab]);
  $('#app').innerHTML = `<h1>Admin</h1><div class="chips">${TABS.map(([k, l, i]) => `<button class="chip ${k === tab ? 'on' : ''}" data-t="${k}">${icon(i)} ${l}</button>`).join('')}<button class="chip" data-t="${tab}" aria-label="Refresh">Refresh</button></div><div id="v" style="margin-top:6px">${VIEW[tab]()}</div>`;
  const sf = $('#sf'); if (sf) sf.onsubmit = async e => { e.preventDefault(); const { data: d, error } = Fields.read(sf, SF, data); if (error) return Toast.show(error); try { await Api.call('aSettingsSave', { values: { ...d, AUTO_ACTIVATE: String(d.AUTO_ACTIVATE) } }); Toast.show('Saved'); } catch (x) { Toast.show(x.message); } };
}
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.t) { tab = b.dataset.t; await load(); }
    else if (b.dataset.reset) {
      const request = data[b.dataset.reset];
      const win = window.open('about:blank', '_blank');
      try {
        const result = await Api.call('aResetPassword', { id: request.id });
        const message = `Hi ${result.name}, your Chaikela password has been reset. Your temporary password is: ${result.password}. Please log in and keep it private.`;
        const url = `https://wa.me/91${result.phone}?text=${encodeURIComponent(message)}`;
        if (win) win.location.href = url;
        else location.href = url;
        Toast.show('Password generated. Review and send the WhatsApp message.');
        await load();
      } catch (x) { if (win) win.close(); throw x; }
    }
    else if (b.dataset.o) { const o = data[b.dataset.o], to = o.status === 'active' ? 'inactive' : 'active'; if (to === 'active' || await Modal.confirm(`Deactivate ${o.name}? It will disappear for customers.`, 'Deactivate')) { await Api.call('aOutletSet', { id: o.id, status: to }); Toast.show('Updated'); await load(); } }
    else if (b.dataset.u) { const u = data[b.dataset.u]; await Api.call('aUserSet', { id: u.id, status: u.status === 'active' ? 'disabled' : 'active' }); Toast.show('Updated'); await load(); }
  } catch (x) { Toast.show(x.message); }
});
await load();
