import { $ , esc } from './dom.js';
import { icon } from './icons.js';
import { Loader } from './loader.js';
import { Toast } from './toast.js';
import { Session } from './session.js';
import { Cart } from './cart.js';
const NAV = {
  CUSTOMER: [['home', 'Restaurants', 'customer/index.html', 'store'], ['cart', 'Cart', 'customer/cart.html', 'cart'], ['orders', 'My orders', 'customer/orders.html', 'receipt'], ['profile', 'Profile', 'customer/profile.html', 'user']],
  MERCHANT: [['orders', 'Orders', 'merchant/index.html', 'receipt'], ['menu', 'Menu', 'merchant/menu.html', 'list'], ['offers', 'Offers', 'merchant/offers.html', 'tag'], ['outlet', 'Restaurant', 'merchant/outlet.html', 'store']],
  ADMIN: []
};
let installPrompt = null;
function makeButtonsInteractive() {
  const convert = node => {
    if (!(node instanceof Element)) return;
    const links = [...(node.matches('a[href]') ? [node] : []), ...node.querySelectorAll('a[href]')];
    for (const link of links) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${link.className || ''} link-button`.trim();
      button.dataset.href = link.getAttribute('href');
      if (link.target) button.dataset.target = link.target;
      for (const attr of ['aria-label', 'aria-current', 'title']) if (link.hasAttribute(attr)) button.setAttribute(attr, link.getAttribute(attr));
      button.innerHTML = link.innerHTML;
      link.replaceWith(button);
    }
  };
  convert(document.body);
  new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(convert)))
    .observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-href]');
    if (!button) return;
    const href = button.dataset.href;
    if (href.startsWith('#')) { document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (button.dataset.target === '_blank' || /^https?:/i.test(href)) { window.open(href, '_blank', 'noopener'); return; }
    location.assign(href);
  });
}
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; showInstall(); });
addEventListener('appinstalled', () => { installPrompt = null; document.querySelector('#pwaInstall')?.remove(); });
function showInstall() {
  if (!installPrompt || document.querySelector('#pwaInstall')) return;
  const b = document.createElement('button'); b.id = 'pwaInstall'; b.className = 'btn ac pwa-install'; b.textContent = 'Install app';
  b.onclick = async () => { if (!installPrompt) return; await installPrompt.prompt(); installPrompt = null; b.remove(); };
  document.body.appendChild(b);
}
/** Shared page shell: loader, toast, auth guard, header and bottom nav. Every page calls `await Layout.mount({roles, active})` first. */
export class Layout {
  static async mount({ roles = null, active = '' } = {}) {
    makeButtonsInteractive();
    Loader.init($('#loader')); Toast.init($('#toast'));
    const root = document.querySelector('meta[name=root]')?.content || '', u = Session.user;
    if (roles && (!Session.token || !u || !roles.includes(u.role))) { location.replace(root + 'index.html'); await new Promise(() => {}); }
    if (u) {
      $('#header').innerHTML = `<header class="top"><div class="wrap row sp"><a class="brand" href="${root + Session.home(u.role)}"><img src="${root}brand.svg" alt=""><span>Chai<span>Kela</span></span></a><div class="row user-tools"><span class="user-name">${esc(u.name.split(' ')[0])}</span><button class="icon-btn" id="logout" aria-label="Log out">${icon('logout')}</button></div></div></header>`;
      $('#logout').onclick = () => { Session.clear(); location.replace(root + 'index.html'); };
      const items = NAV[u.role] || [];
      $('#nav').innerHTML = items.length ? `<nav class="bottom" aria-label="Main">${items.map(([k, l, h, i]) => `<a href="${root + h}" class="${k === active ? 'on' : ''}" ${k === active ? 'aria-current="page"' : ''}>${icon(i)}${l}${k === 'cart' ? '<span class="badge" id="cartBadge" hidden></span>' : ''}</a>`).join('')}</nav>` : '';
      const upd = () => { const b = $('#cartBadge'); if (b) { b.textContent = Cart.count; b.hidden = !Cart.count; } }; upd(); addEventListener('cartchange', upd);
    }
    if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register(root + 'sw.js').catch(() => {}));
    showInstall();
  }
}
