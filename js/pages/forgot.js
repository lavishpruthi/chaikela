import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Toast } from '../core/toast.js';
import { $ } from '../core/dom.js';
await Layout.mount();
$('#app').innerHTML = `<div class="card"><h1 style="margin-top:0">Forgot password?</h1><p class="meta">Enter your registered mobile number. The admin will review your request and send a temporary password on WhatsApp.</p><form id="f" novalidate><label for="p">Mobile number</label><input id="p" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit number" required><button class="btn ac block" style="margin-top:18px">Send reset request</button></form><p id="done" class="hint" role="status" hidden></p><p class="meta" style="text-align:center;margin-top:16px"><a href="index.html">Back to login</a></p></div>`;
$('#f').onsubmit = async e => {
  e.preventDefault();
  try {
    const r = await Api.call('requestPasswordReset', { phone: $('#p').value.trim() }, { auth: false });
    $('#done').textContent = r.message;
    $('#done').hidden = false;
    $('#f button').disabled = true;
  } catch (x) { Toast.show(x.message); }
};
