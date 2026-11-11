/** Client-side image resize (max 900px JPEG) so uploads stay small. */
export function shrink(file, max = 900) {
  return new Promise((res, rej) => { const im = new Image(), u = URL.createObjectURL(file); im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .72)); }; im.onerror = rej; im.src = u; });
}
