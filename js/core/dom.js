export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const timeOf = iso => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
export const dateTimeOf = iso => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const cover = (src, name, cls = '') => `<div class="cover ${cls}" ${src ? `style="background-image:url('${esc(src)}')" role="img" aria-label="${esc(name)}"` : 'aria-hidden="true"'}>${src ? '' : esc((name || '?')[0])}</div>`;
