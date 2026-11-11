const P = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', store: 'M4 9l1-5h14l1 5M4 9a3 3 0 0 0 5.3 2 3 3 0 0 0 5.4 0A3 3 0 0 0 20 9M5 12v8h14v-8', cart: 'M3 4h2l2.4 11h10.2L20 7H6M9 20h.01M17 20h.01',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6', list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01', tag: 'M3 12V4h8l10 10-8 8zM7.5 8h.01', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  logout: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9', plus: 'M12 5v14M5 12h14', edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12l5 5L20 7',
  pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z', phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  bike: 'M6 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15l4-7h5l3 7M9 8H7', bag: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0', clock: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', power: 'M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2'
};
export const icon = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.tag}"/></svg>`;
