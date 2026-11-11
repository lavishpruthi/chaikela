import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { $, esc, money } from '../core/dom.js';
import { icon } from '../core/icons.js';
await Layout.mount({ roles: ['MERCHANT'], active: 'offers' });
let offers = [];
const fields = [{ key: 'title', label: 'Offer title (e.g. 10% off on first order)', required: true, max: 60 }, { key: 'code', label: 'Offer code', required: true, max: 15, pattern: /^[A-Za-z0-9]{3,15}$/, patternMsg: 'Code: 3–15 letters or digits' },
  { key: 'type', label: 'Type', type: 'select', options: [{ value: 'PERCENT', label: 'Percent off' }, { value: 'FLAT', label: 'Flat ₹ off' }] }, { key: 'value', label: 'Value (% or ₹)', type: 'number', required: true, max: 6 },
  { key: 'maxOff', label: 'Max discount ₹ (for % offers, 0 = no limit)', type: 'number', max: 6, default: 0 }, { key: 'minOrder', label: 'Minimum order ₹', type: 'number', max: 6, default: 0 }, { key: 'validTill', label: 'Valid till (optional)', type: 'date' }, { key: 'active', label: 'Active', type: 'toggle', default: true }];
async function load() { offers = await Api.call('mOffers'); draw(); }
function draw() {
  $('#app').innerHTML = `<div class="row sp wrapx"><h1>Offers</h1><button class="btn ac" data-add>${icon('plus')} New offer</button></div>${offers.length ? offers.map((o, i) => `<div class="card row sp wrapx"><div class="grow"><b>${esc(o.title)}</b><div class="meta">Code <b>${esc(o.code)}</b> · ${o.type === 'PERCENT' ? o.value + '% off' + (o.maxOff ? ' (max ' + money(o.maxOff) + ')' : '') : money(o.value) + ' off'}${o.minOrder ? ' · min ' + money(o.minOrder) : ''}${o.validTill ? ' · till ' + esc(o.validTill) : ''}</div><span class="pill ${o.active ? 'ok' : 'bad'}">${o.active ? 'Live' : 'Paused'}</span></div><div class="row"><button class="icon-btn" data-e="${i}" aria-label="Edit ${esc(o.title)}">${icon('edit')}</button><button class="icon-btn no" data-x="${i}" aria-label="Delete ${esc(o.title)}">${icon('trash')}</button></div></div>`).join('') : '<div class="empty">Koi offer nahi. Ek offer chalakar customers laayein.</div>'}`;
}
const edit = async o => { const saved = await Modal.form({ title: o ? 'Edit offer' : 'New offer', fields, values: o || {}, onSubmit: d => Api.call('mOfferSave', { ...(o ? { id: o.id } : {}), ...d }) }); if (saved) { Toast.show('Saved'); load(); } };
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return;
  const action = ['data-e', 'data-x'].find(a => b.hasAttribute(a));
  const o = action ? offers[Number(b.getAttribute(action))] : null;
  if (b.hasAttribute('data-add')) edit(null); else if (action === 'data-e') edit(o);
  else if (action === 'data-x' && await Modal.confirm(`Delete offer ${o.code}?`)) { try { await Api.call('mOfferDelete', { id: o.id }); Toast.show('Deleted'); await load(); } catch (x) { Toast.show(x.message); } }
});
await load();
