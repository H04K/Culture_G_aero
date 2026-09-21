/* ═══════════════════════════════════════════════════════════
   ppl-icons.js — le jeu d'icônes du module PPL

   Des tracés vectoriels plutôt que des emojis : même graisse,
   même grille de 24 px, une seule couleur héritée du contexte
   (currentColor). L'icône suit donc le thème et la couleur de
   la matière sans qu'on ait à s'en occuper.

     Ic.svg('compass', 22)   une icône d'interface
     Ic.mat('meteo', 24)     l'icône d'une matière
   ═══════════════════════════════════════════════════════════ */

const Ic = (() => {

  /* Icônes tracées au trait : le contour suit currentColor. */
  const LINE = {
    /* ---- matières ---- */
    law:      '<path d="M3.2 9.2 12 4.2l8.8 5"/><path d="M4.8 9.6h14.4"/>' +
              '<path d="M6.8 11.6v6M10.2 11.6v6M13.8 11.6v6M17.2 11.6v6"/><path d="M4.2 19.6h15.6"/>',
    gauge:    '<path d="M4.2 17.4a8.6 8.6 0 1 1 15.6 0"/><path d="M12 17.2 15.8 10.6"/>',
    scale:    '<path d="M12 4.4v15.2M8.6 19.6h6.8"/><path d="M4.6 8.2h14.8"/>' +
              '<path d="M4.6 8.2 1.9 14.2h5.4zM19.4 8.2l-2.7 6h5.4z"/>',
    clipboard:'<rect x="4.8" y="4.6" width="14.4" height="15.2" rx="2.8"/>' +
              '<path d="M9.2 5.4V4.2a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.2z"/>' +
              '<path d="m9 12.6 2.2 2.2 4.2-4.6"/>',
    user:     '<circle cx="12" cy="8.4" r="3.8"/><path d="M5.2 20.2c.9-3.5 3.6-5.4 6.8-5.4s5.9 1.9 6.8 5.4"/>',
    cloud:    '<circle cx="8.4" cy="7.8" r="2.9"/>' +
              '<path d="M8.4 19.4h8.4a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-9.8-.6 3.9 3.9 0 0 0 1.1 7.8z"/>',
    compass:  '<circle cx="12" cy="12" r="8.6"/><path d="m15.6 8.4-2 5.2-5.2 2 2-5.2z"/>',
    alert:    '<path d="M12 4.2 21 19.6H3z"/><path d="M12 9.8v4.4"/><path d="M12 17.3v.1"/>',
    wind:     '<path d="M3.4 8.4h9.2a2.6 2.6 0 1 0-2.6-2.6"/>' +
              '<path d="M3.4 12.4h12.8a2.6 2.6 0 1 1-2.6 2.6"/>' +
              '<path d="M3.4 16.4h6.4a2.4 2.4 0 1 1-2.4 2.4"/>',
    radio:    '<circle cx="12" cy="12" r="1.5"/>' +
              '<path d="M8.9 15.1a4.4 4.4 0 0 1 0-6.2M15.1 8.9a4.4 4.4 0 0 1 0 6.2"/>' +
              '<path d="M6.2 17.8a8.2 8.2 0 0 1 0-11.6M17.8 6.2a8.2 8.2 0 0 1 0 11.6"/>',

    /* ---- navigation et interface ---- */
    book:     '<path d="M12 6.8C10.4 5.2 7.8 4.6 4.4 4.8v12.6c3.4-.2 6 .4 7.6 2"/>' +
              '<path d="M12 6.8c1.6-1.6 4.2-2.2 7.6-2v12.6c-3.4-.2-6 .4-7.6 2"/><path d="M12 6.8v12.6"/>',
    tick:     '<rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4.4"/><path d="m8.6 12.2 2.6 2.6 4.8-5.2"/>',
    sliders:  '<path d="M4 7.2h8.2M16.8 7.2H20M4 12h3.2M11.8 12H20M4 16.8h9.2M17.8 16.8H20"/>' +
              '<circle cx="14.5" cy="7.2" r="2.1"/><circle cx="9.5" cy="12" r="2.1"/><circle cx="15.5" cy="16.8" r="2.1"/>',
    chevron:  '<path d="m9.6 6.2 5.8 5.8-5.8 5.8"/>',
    right:    '<path d="M4.6 12h14.8M13.6 6.2 19.4 12l-5.8 5.8"/>',
    left:     '<path d="M19.4 12H4.6M10.4 6.2 4.6 12l5.8 5.8"/>',
    close:    '<path d="m6.4 6.4 11.2 11.2M17.6 6.4 6.4 17.6"/>',
    check:    '<path d="m5.4 12.4 4.4 4.4 8.8-10"/>',
    clock:    '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.2V12l3.4 2"/>',
    target:   '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="4.2"/><path d="M12 11.9v.2"/>',
    repeat:   '<path d="M4.6 10.6a5.6 5.6 0 0 1 5.6-5.4h8.6"/><path d="m15.8 2.2 3.2 3-3.2 3"/>' +
              '<path d="M19.4 13.4a5.6 5.6 0 0 1-5.6 5.4H5.2"/><path d="m8.2 21.8-3.2-3 3.2-3"/>',
    layers:   '<path d="m12 3.4 8.4 4.3-8.4 4.3-8.4-4.3z"/><path d="m4.4 12 7.6 3.9 7.6-3.9M4.4 16.2l7.6 3.9 7.6-3.9"/>',
    bulb:     '<path d="M9.4 18.2h5.2M10.2 21h3.6"/>' +
              '<path d="M12 3a6.2 6.2 0 0 0-3.6 11.2c.5.4.8 1 .8 1.6v.4h5.6v-.4c0-.6.3-1.2.8-1.6A6.2 6.2 0 0 0 12 3z"/>',
    figure:   '<rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2.8"/>' +
              '<path d="m4.6 16.6 4.6-4.6 3.4 3.4 2.8-2.6 4 3.8"/><circle cx="8.8" cy="9.2" r="1.4"/>',
    chart:    '<path d="M4.4 19.6h15.2"/><path d="M7.6 16.4v-5.2M12 16.4V5.6M16.4 16.4V9.2"/>',
    home:     '<path d="M4.4 10.6 12 4.2l7.6 6.4v8.2a1.4 1.4 0 0 1-1.4 1.4H5.8a1.4 1.4 0 0 1-1.4-1.4z"/>' +
              '<path d="M9.6 20.2v-6.4h4.8v6.4"/>',
    trophy:   '<path d="M8 4.2h8v4.4a4 4 0 0 1-8 0z"/>' +
              '<path d="M8 5.6H5.4v1a3 3 0 0 0 2.7 3M16 5.6h2.6v1a3 3 0 0 1-2.7 3"/>' +
              '<path d="M12 12.6v3.2M9 20.2h6l-.8-4.4H9.8z"/>',
    down:     '<path d="M12 3.8v10.8M7.8 10.6 12 14.8l4.2-4.2"/>' +
              '<path d="M4.8 17.4v2a.8.8 0 0 0 .8.8h12.8a.8.8 0 0 0 .8-.8v-2"/>',
    up:       '<path d="M12 14.6V3.8M7.8 8l4.2-4.2L16.2 8"/>' +
              '<path d="M4.8 17.4v2a.8.8 0 0 0 .8.8h12.8a.8.8 0 0 0 .8-.8v-2"/>',
    trash:    '<path d="M4.8 6.6h14.4M9.4 6.6V4.8a1 1 0 0 1 1-1h3.2a1 1 0 0 1 1 1v1.8"/>' +
              '<path d="M6.9 6.6 7.7 20a1 1 0 0 0 1 .9h6.6a1 1 0 0 0 1-.9l.8-13.4"/>',
    pen:      '<path d="M4.6 19.4h4l10-10a2 2 0 0 0-2.8-2.8l-10 10z"/><path d="m14.4 5.4 4.2 4.2"/>',
    swap:     '<path d="M4.6 8.6h12.8M14 5.2l3.4 3.4-3.4 3.4"/><path d="M19.4 15.4H6.6M10 12l-3.4 3.4L10 18.8"/>',
    dots:     '<path d="M6 12h.1M12 12h.1M18 12h.1"/>'
  };

  /* Icônes pleines : l'aplat suit currentColor. */
  const FILL = {
    plane: '<path d="M12 2.2c.72 0 1.25.86 1.25 1.95v4.4l7.05 4.05v1.9l-7.05-2.1v4l2.15 1.55v1.5L12 18.9l-3.4.85v-1.5l2.15-1.55v-4l-7.05 2.1v-1.9l7.05-4.05v-4.4C10.75 3.06 11.28 2.2 12 2.2z"/>',
    prop:  '<circle cx="12" cy="12" r="2.1"/>' +
           '<rect x="11.05" y="2.6" width="1.9" height="7.4" rx=".95"/>' +
           '<rect x="11.05" y="2.6" width="1.9" height="7.4" rx=".95" transform="rotate(120 12 12)"/>' +
           '<rect x="11.05" y="2.6" width="1.9" height="7.4" rx=".95" transform="rotate(240 12 12)"/>',
    play:  '<path d="M8.4 5.2 19.2 12 8.4 18.8z"/>',
    bolt:  '<path d="M13.6 2.2 5.2 13.4h5.2l-.8 8.4 8.4-11h-5.2z"/>',
    flame: '<path d="M12.8 2.2c.4 2.6-.9 4-2.3 5.3-1.4 1.4-3 2.9-3 5.9a6.5 6.5 0 0 0 13 0c0-2.4-1-4.1-2-5.2-.3 1.1-1 1.9-1.9 2.3.3-3.5-1.6-6.6-3.8-8.3z"/>',
    star:  '<path d="m12 3.2 2.7 5.6 6.1.85-4.4 4.3 1.05 6.05L12 17.2l-5.45 2.8L7.6 13.95l-4.4-4.3 6.1-.85z"/>'
  };

  /* Quelle icône pour quelle matière — l'ordre du programme. */
  const MAT = {
    reglementation:     'law',
    cellule:            'plane',
    moteur:             'prop',
    instruments:        'gauge',
    performances:       'scale',
    preparation:        'clipboard',
    'facteurs-humains': 'user',
    meteo:              'cloud',
    navigation:         'compass',
    procedures:         'alert',
    'principes-vol':    'wind',
    radio:              'radio'
  };

  function svg(name, size = 20) {
    const filled = FILL[name];
    const body = filled || LINE[name];
    if (!body) return '';
    const paint = filled
      ? 'fill="currentColor" stroke="none"'
      : 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
    return `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" ${paint} aria-hidden="true">${body}</svg>`;
  }

  const mat = (id, size = 22) => svg(MAT[id] || 'book', size);
  const has = name => !!(LINE[name] || FILL[name]);

  return { svg, mat, has, MAT };
})();
