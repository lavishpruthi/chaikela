export class Toast {
  static #el = null; static #t = 0;
  static init(el) { Toast.#el = el; }
  static show(msg, ms = 3200) {
    const el = Toast.#el; if (!el) return; el.textContent = msg; clearTimeout(Toast.#t);
    try { el.hidePopover(); el.showPopover(); } catch (e) { el.classList.add('on'); }
    Toast.#t = setTimeout(() => { try { el.hidePopover(); } catch (e) { el.classList.remove('on'); } }, ms);
  }
}
