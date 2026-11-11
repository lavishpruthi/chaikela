import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Session } from '../core/session.js';
import { Toast } from '../core/toast.js';
import { $ } from '../core/dom.js';
await Layout.mount();
if (Session.token && Session.user) location.replace(Session.home(Session.user.role));
let role = new URLSearchParams(location.search).get('as') === 'admin' ? 'ADMIN' : 'CUSTOMER';
function draw() {
  const adm = role === 'ADMIN';
  $('#app').innerHTML = `<div class="card"><h1 style="margin-top:0">${adm ? 'Admin login' : 'Welcome back'}</h1>
    ${adm ? '' : `<div class="tabs" role="tablist"><button type="button" role="tab" data-r="CUSTOMER" class="${role === 'CUSTOMER' ? 'on' : ''}" aria-selected="${role === 'CUSTOMER'}">Customer</button><button type="button" role="tab" data-r="MERCHANT" class="${role === 'MERCHANT' ? 'on' : ''}" aria-selected="${role === 'MERCHANT'}">Merchant</button></div>`}
    <form id="f" novalidate><label for="p">Mobile number</label><input id="p" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit number"><label for="w">Password</label><input id="w" type="password" autocomplete="current-password">
    <button class="btn ac block" style="margin-top:18px">Login as ${role === 'CUSTOMER' ? 'Customer' : role === 'MERCHANT' ? 'Merchant' : 'Admin'}</button></form>
    <p class="meta" style="text-align:center;margin-top:16px">${adm ? '<a href="index.html">Back to customer / merchant login</a>' : ` <a href="forgot.html">Forgot password?</a><br>Naye hain? <a href="register.html?role=${role}"><b>Register karein</b></a><br><a href="index.html?as=admin" class="meta">Admin login</a>`}</p></div>`;
  document.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { role = b.dataset.r; draw(); });
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try { const r = await Api.call('login', { phone: $('#p').value.trim(), password: $('#w').value, role }, { auth: false }); Session.set(r); location.replace(Session.home(r.profile.role)); } catch (x) { Toast.show(x.message); }
  };
}
draw();
