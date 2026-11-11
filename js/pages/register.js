import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Session } from '../core/session.js';
import { Toast } from '../core/toast.js';
import { $ } from '../core/dom.js';
await Layout.mount();
let role = new URLSearchParams(location.search).get('role') === 'MERCHANT' ? 'MERCHANT' : 'CUSTOMER';
function draw() {
  const m = role === 'MERCHANT';
  $('#app').innerHTML = `<div class="card"><h1 style="margin-top:0">Naya account</h1><div class="tabs" role="tablist"><button type="button" role="tab" data-r="CUSTOMER" class="${m ? '' : 'on'}" aria-selected="${!m}">Customer</button><button type="button" role="tab" data-r="MERCHANT" class="${m ? 'on' : ''}" aria-selected="${m}">Merchant</button></div>
    <form id="f" novalidate><label for="n">Your name</label><input id="n" maxlength="60" autocomplete="name"><label for="p">Mobile number</label><input id="p" inputmode="numeric" maxlength="10" autocomplete="tel"><label for="w">Password (min 6 characters)</label><input id="w" type="password" autocomplete="new-password">
    ${m ? `<h2>Restaurant details</h2><label for="rn">Restaurant / food spot name</label><input id="rn" maxlength="80"><label for="rc">Cuisine (e.g. Chai, Parathe, Chinese)</label><input id="rc" maxlength="80"><label for="ra">Address</label><textarea id="ra" rows="2" maxlength="200"></textarea><div class="hint">Registration ke baad admin aapka restaurant activate karega. Menu pehle hi add kar sakte hain.</div>` : ''}
    <button class="btn ac block" style="margin-top:18px">Register as ${m ? 'Merchant' : 'Customer'}</button></form><p class="meta" style="text-align:center;margin-top:16px">Pehle se account hai? <a href="index.html"><b>Login karein</b></a></p></div>`;
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { role = b.dataset.r; draw(); });
  $('#f').onsubmit = async e => {
    e.preventDefault(); const g = id => $('#' + id)?.value.trim();
    try {
      const r = await Api.call('register', { role, name: g('n'), phone: g('p'), password: $('#w').value, outlet: m ? { name: g('rn'), cuisine: g('rc'), address: g('ra') } : undefined }, { auth: false });
      Session.set(r); location.replace(Session.home(r.profile.role));
    } catch (x) { Toast.show(x.message); }
  };
}
draw();
