import { esc } from './dom.js';
import { shrink } from './media.js';
/** Declarative form fields. Field: {key,label,type:text|password|tel|number|date|textarea|select|toggle|photo, options:[{value,label}], required, max, pattern, patternMsg, hint, locked} */
export class Fields {
  static render(fields, v = {}) {
    return fields.map(f => {
      const id = 'f_' + f.key, val = v[f.key] ?? f.default ?? '', req = f.required ? ' required' : '', lk = f.locked ? ' disabled' : '', lab = `<label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>`, hint = f.hint ? `<div class="hint">${esc(f.hint)}</div>` : '';
      if (f.type === 'toggle') return `<label class="check"><input type="checkbox" id="${id}" ${val === true || val === 'true' ? 'checked' : ''}${lk}> ${esc(f.label)}</label>`;
      if (f.type === 'photo') return lab + `<div class="photo" id="${id}_w" data-val="${esc(val)}"><img src="${esc(val)}" alt="" ${val ? '' : 'hidden'}><input type="file" id="${id}" accept="image/*"></div>${hint}`;
      if (f.type === 'select') return lab + `<select id="${id}"${req}${lk}>${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(val) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
      if (f.type === 'textarea') return lab + `<textarea id="${id}" rows="3" maxlength="${f.max || 400}"${req}${lk}>${esc(val)}</textarea>${hint}`;
      return lab + `<input id="${id}" type="${f.type === 'tel' ? 'text' : f.type || 'text'}"${f.type === 'tel' || f.type === 'number' ? ' inputmode="decimal"' : ''} maxlength="${f.max || 80}" value="${f.type === 'password' ? '' : esc(val)}"${req}${lk}${f.type === 'password' ? ' autocomplete="new-password"' : ''}>${hint}`;
    }).join('');
  }
  /** Call once after the HTML is in the DOM (wires photo pickers). */
  static bind(form) {
    form.querySelectorAll('.photo input[type=file]').forEach(inp => inp.addEventListener('change', async () => {
      const w = inp.closest('.photo'), f = inp.files[0]; if (!f) return;
      try { const d = await shrink(f); w.dataset.val = d; const im = w.querySelector('img'); im.src = d; im.hidden = false; } catch (e) {}
    }));
  }
  static read(form, fields, v = {}) {
    const data = {};
    for (const f of fields) {
      if (f.type === 'photo') { data[f.key] = form.querySelector(`#f_${f.key}_w`).dataset.val || ''; continue; }
      const el = form.querySelector('#f_' + f.key); if (el.disabled) { data[f.key] = v[f.key]; continue; }
      const val = f.type === 'toggle' ? el.checked : el.value.trim();
      if (f.required && val === '') return { error: `${f.label} is required` };
      if (val && f.pattern && !f.pattern.test(val)) return { error: f.patternMsg || `${f.label} is invalid` };
      data[f.key] = val;
    }
    return { data };
  }
}
