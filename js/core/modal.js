import { esc } from './dom.js';
import { icon } from './icons.js';
import { Fields } from './fields.js';
import { Toast } from './toast.js';
/** Native <dialog> helpers. form() resolves with saved data or null; onSubmit may throw to keep the dialog open. */
export class Modal {
  static open(title, body, label, tone, handler, bind) {
    return new Promise(resolve => {
      const d = document.createElement('dialog'); d.className = 'modal';
      d.innerHTML = `<form method="dialog" novalidate><header><h2>${esc(title)}</h2><button type="button" class="icon-btn" data-x aria-label="Close">${icon('x')}</button></header><div class="body">${body}</div><footer><button type="button" class="btn ghost" data-x>Cancel</button><button class="btn ${tone}">${esc(label)}</button></footer></form>`;
      document.body.append(d); const form = d.querySelector('form'); if (bind) Fields.bind(form);
      const done = v => { d.close(); d.remove(); resolve(v); };
      d.querySelectorAll('[data-x]').forEach(b => b.onclick = () => done(null)); d.addEventListener('cancel', e => { e.preventDefault(); done(null); });
      form.onsubmit = async e => { e.preventDefault(); try { const r = await handler(form); if (r !== undefined) done(r); } catch (x) { Toast.show(x.message); } };
      d.showModal();
    });
  }
  static form({ title, fields, values = {}, submit = 'Save', onSubmit }) {
    return Modal.open(title, Fields.render(fields, values), submit, 'ac', async form => {
      const { data, error } = Fields.read(form, fields, values); if (error) { Toast.show(error); return undefined; } await onSubmit(data); return data;
    }, true);
  }
  static async confirm(message, label = 'Yes, delete') { return !!(await Modal.open('Please confirm', `<p>${esc(message)}</p>`, label, 'no', () => true, false)); }
}
