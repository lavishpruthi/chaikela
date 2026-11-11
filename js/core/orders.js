import { esc } from './dom.js';
/** Order status model (mirrors backend FLOW). */
export const FLOW = {
  DELIVERY: ['PLACED', 'CONFIRMED', 'PREPARING', 'PREPARED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  RAPIDO: ['PLACED', 'CONFIRMED', 'PREPARING', 'PREPARED', 'PICKED_UP', 'DELIVERED'],
  TAKEAWAY: ['PLACED', 'CONFIRMED', 'PREPARING', 'PREPARED', 'DELIVERED']
};
const LABEL = { PLACED: 'Order received', CONFIRMED: 'Confirmed', PREPARING: 'Preparing', PREPARED: 'Prepared', PICKED_UP: 'Picked by delivery', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Received', CANCELLED: 'Cancelled' };
export const FUL = { DELIVERY: 'Restaurant delivery', RAPIDO: 'Rapido pickup', TAKEAWAY: 'Takeaway' };
export const label = (s, ful) => (s === 'DELIVERED' && ful === 'TAKEAWAY' ? 'Collected' : s === 'PICKED_UP' && ful === 'RAPIDO' ? 'Picked by Rapido' : LABEL[s] || s);
export const next = o => { const f = FLOW[o.fulfilment], i = f.indexOf(o.status); return i >= 0 && i < f.length - 1 ? f[i + 1] : null; };
export const isOpen = o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED';
export const tone = s => s === 'DELIVERED' ? 'ok' : s === 'CANCELLED' ? 'bad' : s === 'PLACED' ? 'ac' : 'warn';
export function tracker(o) {
  if (o.status === 'CANCELLED') return '<span class="pill bad">Cancelled</span>';
  const f = FLOW[o.fulfilment], cur = f.indexOf(o.status);
  return `<div class="track" role="list" aria-label="Order progress">${f.map((s, i) => `<div class="st ${i < cur || o.status === 'DELIVERED' ? 'done' : i === cur ? 'cur' : ''}" role="listitem"><i></i>${esc(label(s, o.fulfilment))}</div>`).join('')}</div>`;
}
