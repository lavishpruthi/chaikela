import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Modal } from '../core/modal.js';
import { $, esc, money, cover } from '../core/dom.js';
import { icon } from '../core/icons.js';
await Layout.mount({ roles: ['MERCHANT'], active: 'menu' });
let items = [];
const fields = [{ key: 'name', label: 'Dish name', required: true }, { key: 'description', label: 'Description', type: 'textarea', max: 300 }, { key: 'category', label: 'Category (e.g. Chai, Parathe)', max: 40, default: 'Others' },
  { key: 'price', label: 'Price (₹)', type: 'number', required: true, max: 6, pattern: /^\d+(\.\d{1,2})?$/, patternMsg: 'Enter a valid price' }, { key: 'veg', label: 'Vegetarian', type: 'toggle', default: true }, { key: 'available', label: 'Available now', type: 'toggle', default: true },
  { key: 'photo1', label: 'Photo 1', type: 'photo' }, { key: 'photo2', label: 'Photo 2', type: 'photo', hint: 'Dono photos optional hain, par photo se orders badhte hain.' }];
async function load() { items = await Api.call('mMenu'); draw(); }
function draw() {
  $('#app').innerHTML = `<div class="row sp"><h1>Menu</h1><button class="btn ac" data-add>${icon('plus')} Add dish</button></div>${items.length ? items.map((m, i) => `<div class="card row" style="align-items:flex-start"><div class="row" style="gap:6px;flex:none">${cover(m.photo1, m.name, '')}</div><div class="grow"><div class="row" style="gap:6px"><span class="veg ${m.veg ? '' : 'nv'}"></span><b>${esc(m.name)}</b></div><div class="meta">${esc(m.category)} · ${esc(m.description)}</div><div class="row sp wrapx" style="margin-top:6px"><span class="price">${money(m.price)}</span><div class="row"><button class="pill ${m.available ? 'ok' : 'bad'}" style="border:0;min-height:32px;cursor:pointer" data-t="${i}" aria-label="Toggle availability of ${esc(m.name)}">${m.available ? 'Available' : 'Sold out'}</button><button class="icon-btn" data-e="${i}" aria-label="Edit ${esc(m.name)}">${icon('edit')}</button><button class="icon-btn no" data-x="${i}" aria-label="Delete ${esc(m.name)}">${icon('trash')}</button></div></div></div></div>`).join('') : '<div class="empty">Abhi koi dish nahi. "Add dish" se shuru karein.</div>'}`;
}
const edit = async m => { const saved = await Modal.form({ title: m ? 'Edit dish' : 'Add dish', fields, values: m || {}, onSubmit: d => Api.call('mMenuSave', { ...(m ? { id: m.id } : {}), ...d }) }); if (saved) { Toast.show('Saved'); load(); } };
$('#app').addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return; const m = items[b.dataset.e ?? b.dataset.t ?? b.dataset.x];
  if (b.hasAttribute('data-add')) edit(null); else if (b.dataset.e) edit(m);
  else if (b.dataset.t) { try { await Api.call('mMenuSave', { ...m, available: !m.available }); load(); } catch (x) { Toast.show(x.message); } }
  else if (b.dataset.x && await Modal.confirm(`Delete "${m.name}"?`)) { try { await Api.call('mMenuDelete', { id: m.id }); Toast.show('Deleted'); load(); } catch (x) { Toast.show(x.message); } }
});
await load();
