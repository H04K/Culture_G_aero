/* ═══════════════════════════════════════════════════════════
   icons.js — le jeu d'icônes de l'application

   Des tracés vectoriels plutôt que des emojis : même graisse,
   même grille de 24 px, une seule couleur héritée du contexte
   (currentColor). L'icône suit donc le thème et la couleur de
   la matière sans qu'on ait à s'en occuper.

     Ic.svg('compass', 22)   une icône d'interface
     Ic.mat('meteo', 24)     une matière du PPL
     Ic.cat('espace', 22)    un thème de culture générale
     Ic.ue('ue7', 22)        une UE du PASS
     Ic.mod('pass', 26)      un module de l'accueil
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

    /* ---- culture générale ---- */
    hourglass:'<path d="M7 3.4h10M7 20.6h10"/>' +
              '<path d="M8.2 3.4v3.2c0 2 3.8 3.6 3.8 5.4 0-1.8 3.8-3.4 3.8-5.4V3.4"/>' +
              '<path d="M8.2 20.6v-3.2c0-2 3.8-3.6 3.8-5.4 0 1.8 3.8 3.4 3.8 5.4v3.2"/>',
    turbine:  '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="2"/>' +
              '<path d="M12 3.6v6M12 14.4v6M3.6 12h6M14.4 12h6"/>',
    tower:    '<path d="M9 20.8h6"/><path d="M10.2 20.8 11.2 9.2h1.6l1 11.6"/>' +
              '<path d="M7.4 5.2h9.2l-1.7 4H9.1z"/><path d="M12 5.2V2.6"/>',
    airport:  '<path d="M3 20.6h18"/><path d="M5.6 20.6V9.8L12 6.4l6.4 3.4v10.8"/>' +
              '<path d="M9.4 20.6v-4.4h5.2v4.4"/><path d="M9 12.4h1.4M13.6 12.4H15"/>',
    factory:  '<path d="M3.4 20.6h17.2"/><path d="M4.8 20.6V11l5 3V11l5 3V7.4h4.4v13.2"/>' +
              '<path d="M8.4 17.4h1.2M13.4 17.4h1.2"/>',
    globe:    '<circle cx="12" cy="12" r="8.6"/><path d="M3.5 12h17"/>' +
              '<path d="M12 3.4c2.2 2.4 3.4 5.4 3.4 8.6s-1.2 6.2-3.4 8.6c-2.2-2.4-3.4-5.4-3.4-8.6S9.8 5.8 12 3.4z"/>',
    map:      '<path d="m3.6 6.8 5.4-2.4 6 2.6 5.4-2.4v12.6l-5.4 2.4-6-2.6-5.4 2.4z"/>' +
              '<path d="M9 4.4v14.6M15 7v14.6"/>',
    rocket:   '<path d="M12 2.8c2.7 2 4.2 5.1 4.2 8.6 0 1.9-.4 3.5-1.1 4.8H8.9c-.7-1.3-1.1-2.9-1.1-4.8 0-3.5 1.5-6.6 4.2-8.6z"/>' +
              '<circle cx="12" cy="10" r="1.9"/>' +
              '<path d="m8.9 16.8-2.3 2.8 2.7-.7M15.1 16.8l2.3 2.8-2.7-.7"/>' +
              '<path d="M10.6 20.6c.5.9 2.3.9 2.8 0"/>',
    shield:   '<path d="M12 2.8 4.9 5.9v6c0 4.4 3 7.5 7.1 9.2 4.1-1.7 7.1-4.8 7.1-9.2v-6z"/>' +
              '<path d="m9.2 11.8 2 2 3.6-3.8"/>',
    medal:    '<path d="m5.2 9.6 6.8-4.4 6.8 4.4"/><path d="m5.2 14.2 6.8-4.4 6.8 4.4"/>' +
              '<path d="m5.2 18.8 6.8-4.4 6.8 4.4"/>',
    news:     '<rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.4"/>' +
              '<path d="M6.6 9h6.2M6.6 12.4h6.2M6.6 15.8h4"/><rect x="15.6" y="9" width="3.2" height="6.8" rx=".8"/>',
    idcard:   '<rect x="3" y="5.6" width="18" height="12.8" rx="2.6"/><circle cx="9" cy="11.2" r="2.2"/>' +
              '<path d="M5.8 16.4c.5-1.5 1.8-2.3 3.2-2.3s2.7.8 3.2 2.3"/><path d="M14.8 10.4h3.8M14.8 13.6h3.8"/>',
    tail:     '<path d="M6.8 19.2 12.6 5.2h2.8l2.4 14z"/><path d="M4.4 19.2h15.2"/><path d="M9.6 12.4h6.6"/>',

    /* ---- PASS ---- */
    flask:    '<path d="M9.8 3.4v5.4L5.1 17a2.2 2.2 0 0 0 1.9 3.4h10a2.2 2.2 0 0 0 1.9-3.4l-4.7-8.2V3.4"/>' +
              '<path d="M8.4 3.4h7.2M7.2 14.6h9.6"/>',
    cell:     '<circle cx="12" cy="12" r="8.4"/><circle cx="11.4" cy="11.4" r="3"/>' +
              '<circle cx="16.4" cy="15.4" r="1.1"/><circle cx="7.6" cy="15" r="1.1"/>',
    dna:      '<path d="M7.6 2.8c0 5 8.8 5.4 8.8 9.2s-8.8 4.2-8.8 9.2"/>' +
              '<path d="M16.4 2.8c0 5-8.8 5.4-8.8 9.2s8.8 4.2 8.8 9.2"/>' +
              '<path d="M8.8 6.4h6.4M7.8 17.6h8.4"/>',
    heart:    '<path d="M12 20.4S3.9 15.3 3.9 9.6A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 8.1 2.4c0 5.7-8.1 10.8-8.1 10.8z"/>',
    atom:     '<circle cx="12" cy="12" r="1.9"/><ellipse cx="12" cy="12" rx="9" ry="3.8"/>' +
              '<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)"/>' +
              '<ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)"/>',
    magnet:   '<path d="M6 4.6h3.6v8a2.4 2.4 0 0 0 4.8 0v-8H18v8a6 6 0 0 1-12 0z"/>' +
              '<path d="M6 9h3.6M14.4 9H18"/>',
    bone:     '<path d="M9.4 14.6 14.6 9.4"/><circle cx="7.4" cy="14.6" r="2.1"/><circle cx="9.4" cy="16.6" r="2.1"/>' +
              '<circle cx="16.6" cy="9.4" r="2.1"/><circle cx="14.6" cy="7.4" r="2.1"/>',
    body:     '<circle cx="12" cy="4.6" r="2.2"/><path d="M12 7.2v7.2M8.2 9.6h7.6"/>' +
              '<path d="m9.6 20.8 2.4-6.4 2.4 6.4"/><path d="M8.2 9.6 6.8 13M15.8 9.6 17.2 13"/>',
    baby:     '<circle cx="12" cy="8.2" r="4.4"/><path d="M10.2 7.6h.1M13.8 7.6h.1M10.6 10.2c.8.7 2 .7 2.8 0"/>' +
              '<path d="M6.8 20.6c.7-3.2 2.6-4.8 5.2-4.8s4.5 1.6 5.2 4.8"/>',
    microscope:'<path d="M5.6 20.6h13"/><path d="M9.6 20.6a6 6 0 0 0 5.8-6"/>' +
              '<path d="m11.2 4.6-3 4.8 3.4 2 2.8-4.8a2 2 0 0 0-.7-2.7l-.4-.2a2 2 0 0 0-3.1 1z"/>' +
              '<path d="m7.6 11.2 3.4 2M6.6 16.6h4.4"/>',
    hospital: '<rect x="4" y="6.6" width="16" height="13.8" rx="2.4"/>' +
              '<path d="M12 10v5.2M9.4 12.6h5.2"/>' +
              '<path d="M8.6 6.6V4.6a1 1 0 0 1 1-1h4.8a1 1 0 0 1 1 1v2"/>',
    pill:     '<path d="M7 17a4.2 4.2 0 0 1 0-6l4-4a4.2 4.2 0 0 1 6 6l-4 4a4.2 4.2 0 0 1-6 0z"/><path d="m9.4 14.6 5.2-5.2"/>',
    skull:    '<path d="M12 3.2c-4.3 0-7.3 3-7.3 7 0 2.3 1 4 2.3 5.1v2.5a1.6 1.6 0 0 0 1.6 1.6h1.2v2.4h4.4v-2.4h1.2a1.6 1.6 0 0 0 1.6-1.6v-2.5c1.3-1.1 2.3-2.8 2.3-5.1 0-4-3-7-7.3-7z"/>' +
              '<circle cx="9.5" cy="11" r="1.7"/><circle cx="14.5" cy="11" r="1.7"/>' +
              '<path d="M11.2 15.4h1.6"/>',
    screw:    '<path d="M12 2.8v10.6"/><path d="M8.8 4.8h6.4M9.2 7.6h5.6M9.6 10.4h4.8"/>' +
              '<path d="m12 21.2-3.2-4.6h6.4z"/>',
    chat:     '<path d="M4.4 6.6a2 2 0 0 1 2-2h11.2a2 2 0 0 1 2 2v7.4a2 2 0 0 1-2 2H9.8l-4.2 3.6z"/>' +
              '<path d="M8.4 8.8h7.2M8.4 12h4.6"/>',
    stetho:   '<path d="M6 3.4v4.2a4 4 0 0 0 8 0V3.4"/><path d="M4.6 3.4h2.8M12.6 3.4h2.8"/>' +
              '<path d="M10 11.6v2.8a4.2 4.2 0 0 0 8.4 0v-1.2"/><circle cx="18.4" cy="11" r="2"/>',
    calendar: '<rect x="3.6" y="5" width="16.8" height="15.4" rx="2.6"/><path d="M3.6 9.8h16.8"/>' +
              '<path d="M8 3.4v3.2M16 3.4v3.2"/>' +
              '<path d="M7.6 13.4h.1M12 13.4h.1M16.4 13.4h.1M7.6 16.8h.1M12 16.8h.1"/>',
    keypad:   '<rect x="4.4" y="3.4" width="15.2" height="17.2" rx="2.6"/>' +
              '<path d="M8.6 8h.1M12 8h.1M15.4 8h.1M8.6 12h.1M12 12h.1M15.4 12h.1M8.6 16h.1M12 16h.1M15.4 16h.1"/>',

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
    plus:     '<path d="M12 5.4v13.2M5.4 12h13.2"/>',
    undo:     '<path d="M4.8 8.6h8.6a5.3 5.3 0 0 1 0 10.6H7.2"/><path d="m8.4 4.4-3.6 4.2 3.6 4.2"/>',
    sound:    '<path d="M5 9.4h3l4.4-3.6v12.4L8 14.6H5z"/><path d="M16 9.6a3.8 3.8 0 0 1 0 4.8M18.6 7.2a7.2 7.2 0 0 1 0 9.6"/>',
    mute:     '<path d="M5 9.4h3l4.4-3.6v12.4L8 14.6H5z"/><path d="m16.4 10 4.2 4M20.6 10l-4.2 4"/>',
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

  /* Les 22 thèmes de culture générale. */
  const CAT = {
    histoire: 'hourglass',      aerodynamique: 'wind',   motorisation: 'turbine',
    cellule: 'plane',           instruments: 'gauge',    navigation: 'compass',
    meteo: 'cloud',             reglementation: 'law',   atc: 'tower',
    aeroports: 'airport',       constructeurs: 'factory', compagnies: 'globe',
    airfrance: 'tail',          'facteurs-humains': 'user', performances: 'scale',
    securite: 'shield',         actualite: 'news',       espace: 'rocket',
    militaire: 'medal',         licences: 'idcard',      geographie: 'map',
    litterature: 'book'
  };

  /* Les 19 UE du PASS. */
  const UE = {
    ue1: 'chat',    ue4: 'scale',      ue5: 'hospital', ue6: 'cell',
    ue7: 'flask',   ue8: 'heart',      ue9: 'magnet',   ue10: 'body',
    ue11: 'baby',   ue12: 'microscope', ue13: 'chart',  ue14: 'atom',
    ue15: 'dna',    ue16: 'pill',      ue17: 'body',    ue18: 'skull',
    ue19: 'screw',  ue20: 'pill',      ue21: 'bone'
  };

  /* Les modules de l'accueil. */
  const MOD = {
    culture: 'globe', calcul: 'keypad', pass: 'stetho', ppl: 'plane', jeux: 'screw'
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
  const cat = (id, size = 22) => svg(CAT[id] || 'book', size);
  const ue  = (id, size = 22) => svg(UE[id]  || 'flask', size);
  const mod = (id, size = 24) => svg(MOD[id] || 'book', size);
  const has = name => !!(LINE[name] || FILL[name]);

  return { svg, mat, cat, ue, mod, has, MAT, CAT, UE, MOD };
})();
