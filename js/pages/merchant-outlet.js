import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { Fields } from '../core/fields.js';
import { $, esc } from '../core/dom.js';
await Layout.mount({ roles: ['MERCHANT'], active: 'outlet' });
const o = await Api.call('mOutlet'), phone = /^[6-9]\d{9}$/;
const fields = [{ key: 'name', label: 'Restaurant name', required: true }, { key: 'cuisine', label: 'Cuisine' }, { key: 'description', label: 'About', type: 'textarea' }, { key: 'address', label: 'Address', type: 'textarea', required: true, max: 200 },
  { key: 'phone', label: 'Contact number (customers will call this)', type: 'tel', max: 10, required: true, pattern: phone, patternMsg: 'Enter a valid 10-digit number' }, { key: 'photo', label: 'Restaurant photo (optional)', type: 'photo' },
  { key: 'selfDelivery', label: 'We deliver with our own rider', type: 'toggle' }, { key: 'deliveryFee', label: 'Delivery fee ₹ (leave blank for default)', type: 'number', max: 5 },
  { key: 'minOrder', label: 'Minimum order ₹', type: 'number', max: 6, default: 0 }, { key: 'prepMins', label: 'Usual preparation time (minutes)', type: 'number', max: 3, default: 20 }];
$('#app').innerHTML = `<h1>Restaurant profile</h1><div class="row wrapx" style="gap:8px"><span class="pill">${esc(o.id)}</span><span class="pill ${o.status === 'active' ? 'ok' : 'warn'}">${o.status === 'active' ? 'Active' : 'Pending admin approval'}</span><span class="pill">${esc(o.plan)} plan</span></div>
  <form id="f" class="card" style="margin-top:14px" novalidate>${Fields.render(fields, o)}<button class="btn ac block" style="margin-top:18px">Save changes</button></form>`;
Fields.bind($('#f'));
$('#f').onsubmit = async e => {
  e.preventDefault(); const { data, error } = Fields.read($('#f'), fields, o); if (error) return Toast.show(error);
  try { await Api.call('mOutletSave', data); Toast.show('Saved'); } catch (x) { Toast.show(x.message); }
};
