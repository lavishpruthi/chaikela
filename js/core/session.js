/** Logged-in user + token, persisted so the user stays logged in. */
export class Session {
  static get token() { return localStorage.getItem('ck_token'); }
  static get user() { try { return JSON.parse(localStorage.getItem('ck_user')); } catch (e) { return null; } }
  static set({ token, profile }) { localStorage.setItem('ck_token', token); localStorage.setItem('ck_user', JSON.stringify(profile)); }
  static clear() { localStorage.removeItem('ck_token'); localStorage.removeItem('ck_user'); }
  static home(role) { return { CUSTOMER: 'customer/index.html', MERCHANT: 'merchant/index.html', ADMIN: 'admin/index.html' }[role] || 'index.html'; }
}
