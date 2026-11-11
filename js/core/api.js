import { CONFIG } from '../config.js';
import { Loader } from './loader.js';
import { Session } from './session.js';
const GET = new Set(['outlets', 'menu', 'config']);
/** The only place that talks to the backend. Shows the loader unless {silent:true} (used by background polling). */
export class Api {
  static async call(action, data = {}, { auth = true, silent = false } = {}) {
    if (!CONFIG.API_URL) throw new Error('API_URL is not set in js/config.js');
    const payload = { action, ...data, ...(auth && Session.token ? { token: Session.token } : {}) };
    const req = GET.has(action) ? fetch(`${CONFIG.API_URL}?${new URLSearchParams(payload)}`) : fetch(CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
    let res; try { res = await (await (silent ? req : Loader.track(req))).json(); } catch (e) { throw new Error('No connection. Please check your internet.'); }
    if (!res.ok) { if (/^Session expired/.test(res.error)) { Session.clear(); const r = document.querySelector('meta[name=root]')?.content || ''; location.replace(r + 'index.html'); } throw new Error(res.error); }
    return res.data;
  }
}
