/** Full-screen loader. Reference-counted. While on: every other <body> child is inert and has pointer-events:none (see base.css). */
export class Loader {
  static #n = 0; static #el = null;
  static init(el) { Loader.#el = el; }
  static #toggle(on) {
    const el = Loader.#el; if (!el) return;
    [...document.body.children].forEach(c => { if (c !== el) c.toggleAttribute('inert', on); });
    document.body.classList.toggle('is-busy', on);
    try { on ? el.showPopover() : el.hidePopover(); } catch (e) { el.classList.toggle('on', on); }
  }
  static async track(p) { if (++Loader.#n === 1) Loader.#toggle(true); try { return await p; } finally { if (--Loader.#n === 0) Loader.#toggle(false); } }
}
