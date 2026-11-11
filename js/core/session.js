/** Logged-in user + token, persisted so the user stays logged in. */
export class Session {
  static get token() { return localStorage.getItem('ck_token'); }
  static get user() { try { return JSON.parse(localStorage.getItem('ck_user')); } catch (e) { return null; } }
  static get isLocallyValid() {
    const token = Session.token, user = Session.user;
    if (!token || !user || !['CUSTOMER', 'MERCHANT', 'ADMIN'].includes(user.role)) return false;
    try {
      const part = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      const payload = atob(part + '='.repeat((4 - part.length % 4) % 4));
      const expiresAt = Number(payload.split('|')[1]);
      return Number.isFinite(expiresAt) && expiresAt > Date.now();
    } catch (e) { return false; }
  }
  static set({ token, profile }) { localStorage.setItem('ck_token', token); localStorage.setItem('ck_user', JSON.stringify(profile)); }
  static clear() { localStorage.removeItem('ck_token'); localStorage.removeItem('ck_user'); }
  static home(role) { return { CUSTOMER: 'customer/index.html', MERCHANT: 'merchant/index.html', ADMIN: 'admin/index.html' }[role] || 'index.html'; }
}
