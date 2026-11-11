import { Layout } from '../core/layout.js';
import { Api } from '../core/api.js';
import { Session } from '../core/session.js';
import { $, esc } from '../core/dom.js';

await Layout.mount({ roles: ['CUSTOMER'], active: 'profile' });
const u = Session.user;

$('#app').innerHTML = `
  <h1>Profile</h1>
  <div class="card" style="margin-bottom:16px">
    <h2 style="margin:0 0 12px">Account details</h2>
    <div class="meta">Name</div>
    <div style="font-weight:700; margin-bottom:10px">${esc(u?.name || '')}</div>
    <div class="meta">Phone</div>
    <div style="font-weight:700; margin-bottom:10px">${esc(u?.phone || '')}</div>
    <div class="meta">Role</div>
    <div style="font-weight:700">Customer</div>
  </div>
  <div class="card">
    <h2 style="margin:0 0 12px">Change password</h2>
    <form id="pwForm" novalidate style="display:grid;gap:12px">
      <div>
        <label for="curPw">Current password</label>
        <input id="curPw" type="password" autocomplete="current-password" placeholder="Enter current password" required>
      </div>
      <div>
        <label for="newPw">New password</label>
        <input id="newPw" type="password" autocomplete="new-password" placeholder="Minimum 6 characters" required>
      </div>
      <div>
        <label for="confirmPw">Confirm new password</label>
        <input id="confirmPw" type="password" autocomplete="new-password" placeholder="Re-enter new password" required>
      </div>
      <button class="btn ac block" type="submit">Update password</button>
    </form>
    <p id="pwStatus" class="hint" role="status" hidden></p>
  </div>
`;

$('#pwForm').onsubmit = async (e) => {
  e.preventDefault();
  const status = $('#pwStatus');
  try {
    const result = await Api.call('changePassword', {
      currentPassword: $('#curPw').value,
      newPassword: $('#newPw').value,
      confirmPassword: $('#confirmPw').value,
    });
    $('#pwForm').reset();
    status.textContent = result.message;
    status.hidden = false;
    status.style.color = '#1f7a4b';
  } catch (x) {
    status.textContent = x.message;
    status.hidden = false;
    status.style.color = '#b42318';
  }
};
