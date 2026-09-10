/* ═══════════════════════════════════════════════════════════
   ppl-figures.js — schémas vectoriels du cours PPL

   Tout est en SVG inline : aucune image externe, donc rien à
   télécharger et un rendu net à toutes les tailles, hors-ligne
   comme en ligne. Les couleurs viennent des variables CSS via
   les classes définies dans css/ppl.css (section « schémas ») :

     .t  texte fort   .g  texte discret   .mid/.end  ancrage
     .s  trait de structure       .o  contour
     .a / .af  accent vert        .b / .bf  bleu
     .w / .wf  ambre (attention)  .k / .kf  rouge (danger)
     .dash  pointillés            .fill  aplat de surface

   Les flèches utilisent les marqueurs partagés injectés une
   seule fois dans la page par Figs.defs().

   Une figure : Figs.add(id, matière, titre, légende, svg)
   Un cours l'appelle avec  fig:'id'  ou  fig:['id1','id2']
   ═══════════════════════════════════════════════════════════ */

const Figs = (() => {
  const items = [];
  const byId  = {};

  function add(id, mat, title, cap, svg) {
    const f = { id, mat, title, cap, svg };
    items.push(f); byId[id] = f;
  }

  const get  = id => byId[id];
  const all  = () => items;
  const byMat = m => items.filter(f => f.mat === m);
  const count = () => items.length;

  /** Bloc <figure> prêt à insérer dans une fiche de cours. */
  function render(id) {
    const f = byId[id];
    if (!f) return '';
    return `<figure class="fig" data-fig="${id}">
      <figcaption class="fig-head">${f.title}</figcaption>
      ${f.svg}
      ${f.cap ? `<figcaption class="fig-cap">${f.cap}</figcaption>` : ''}
    </figure>`;
  }

  /** Accepte une chaîne ou un tableau d'identifiants. */
  function renderAll(fig) {
    if (!fig) return '';
    return (Array.isArray(fig) ? fig : [fig]).map(render).join('');
  }

  /** Marqueurs de flèches partagés — à injecter une fois dans la page. */
  const defs = () => `<svg class="fig-defs" aria-hidden="true" width="0" height="0"><defs>
    ${['a:af', 'b:bf', 'w:wf', 'k:kf', 'm:mf'].map(p => {
      const [n, c] = p.split(':');
      return `<marker id="ar-${n}" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5"
                orient="auto" markerUnits="strokeWidth">
                <path d="M0,0.4 L7,3.5 L0,6.6 Z" class="${c}"/></marker>`;
    }).join('')}
  </defs></svg>`;

  return { add, get, all, byMat, count, render, renderAll, defs };
})();


/* ═══════════════ PRINCIPES DU VOL ═══════════════ */

Figs.add('forces', 'principes-vol',
"Les quatre forces",
"En vol rectiligne uniforme, portance = poids et traction = traînée. La portance est perpendiculaire au <b>vent relatif</b>, jamais à l'horizon.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Les quatre forces appliquées à un avion">
  <g class="o" stroke-width="1.4" fill="none">
    <path d="M136 132 C152 120 198 118 224 128 C228 129 228 133 224 134 C198 142 152 142 136 136 Z"/>
    <path d="M141 131 l7 -19 l13 19"/>
    <path d="M136 131 h20"/>
    <path d="M170 134 l-9 10 h28 z"/>
  </g>

  <line x1="180" y1="114" x2="180" y2="56" class="a" marker-end="url(#ar-a)"/>
  <text x="180" y="46" class="mid t">PORTANCE</text>
  <text x="180" y="34" class="mid g">Fz — ⟂ vent relatif</text>

  <line x1="180" y1="148" x2="180" y2="200" class="b" marker-end="url(#ar-b)"/>
  <text x="180" y="216" class="mid t">POIDS</text>

  <line x1="230" y1="131" x2="318" y2="131" class="a" marker-end="url(#ar-a)"/>
  <text x="276" y="122" class="mid t">TRACTION</text>

  <line x1="130" y1="131" x2="46" y2="131" class="b" marker-end="url(#ar-b)"/>
  <text x="86" y="122" class="mid t">TRAÎNÉE</text>

  <line x1="230" y1="150" x2="290" y2="150" class="s dash"/>
  <text x="292" y="153" class="g">vent relatif</text>
</svg>`);

Figs.add('cz-incidence', 'principes-vol',
"Portance et incidence : le décrochage",
"Le Cz croît avec l'incidence jusqu'à un maximum, puis s'effondre. Ce point survient <b>toujours à la même incidence</b> — jamais à une vitesse donnée. Les volets relèvent le Cz max (donc abaissent Vs) mais décrochent un peu plus tôt.",
`<svg viewBox="0 0 360 230" role="img" aria-label="Courbe du coefficient de portance en fonction de l'incidence">
  <line x1="46" y1="20" x2="46" y2="186" class="s"/>
  <line x1="46" y1="186" x2="340" y2="186" class="s"/>
  <text x="46" y="14" class="mid g">Cz</text>
  <text x="340" y="204" class="end g">incidence (°)</text>

  <path d="M46 178 L214 66 C232 51 250 48 262 56 C276 66 288 110 300 150"
        class="a" fill="none"/>
  <path d="M46 166 L196 44 C212 30 230 27 240 35 C252 45 264 92 276 136"
        class="b dash" fill="none"/>

  <circle cx="258" cy="52" r="4" class="af"/>
  <line x1="258" y1="56" x2="258" y2="186" class="s dash"/>
  <text x="266" y="42" class="t">décrochage</text>
  <text x="266" y="30" class="g">≈ 15°, constante</text>

  <circle cx="236" cy="31" r="3.5" class="bf"/>
  <text x="186" y="26" class="end t">volets sortis</text>
  <text x="186" y="38" class="end g">Cz max ↑ donc Vs ↓</text>

  <text x="258" y="200" class="mid g">15°</text>
  <text x="46" y="200" class="mid g">0°</text>
</svg>`);

Figs.add('trainees', 'principes-vol',
"Les deux traînées et la finesse maximale",
"La traînée parasite croît en V², la traînée induite décroît en 1/V². Leur somme donne une courbe en U dont le minimum est la <b>finesse maximale</b> : plané le plus long, et vitesse la plus économique en distance.",
`<svg viewBox="0 0 360 230" role="img" aria-label="Courbes de traînée parasite, induite et totale">
  <line x1="46" y1="18" x2="46" y2="182" class="s"/>
  <line x1="46" y1="182" x2="340" y2="182" class="s"/>
  <text x="46" y="12" class="mid g">traînée</text>
  <text x="340" y="200" class="end g">vitesse</text>

  <path d="M56 34 C90 118 130 156 200 168 C250 176 300 179 332 180" class="b" fill="none"/>
  <text x="336" y="172" class="end g">induite (1/V²)</text>

  <path d="M56 181 C140 179 210 160 268 116 C300 92 318 64 330 40" class="w" fill="none"/>
  <text x="336" y="36" class="end g">parasite (V²)</text>

  <path d="M58 30 C96 104 132 126 176 126 C230 126 292 82 330 26" class="a" fill="none"/>
  <text x="120" y="46" class="t">traînée totale</text>

  <circle cx="176" cy="126" r="4.5" class="af"/>
  <line x1="176" y1="130" x2="176" y2="182" class="a dash"/>
  <text x="176" y="198" class="mid t">finesse max</text>
  <text x="176" y="112" class="mid g">traînée minimale</text>

  <path d="M56 150 L150 150" class="s dash"/>
  <text x="52" y="163" class="g">second régime</text>
  <text x="52" y="174" class="g">plus lent = plus de puissance</text>
</svg>`);

Figs.add('virage-n', 'principes-vol',
"Virage : facteur de charge et vitesse de décrochage",
"En virage, la portance s'incline. Sa composante verticale doit toujours équilibrer le poids : la portance <b>totale</b> doit donc augmenter, et avec elle le facteur de charge. La vitesse de décrochage est multipliée par √n.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Décomposition de la portance en virage incliné">
  <g transform="translate(120,150) rotate(-40)">
    <rect x="-42" y="-3" width="84" height="6" rx="3" class="fill o"/>
    <ellipse cx="0" cy="0" rx="9" ry="13" class="fill o"/>
    <path d="M0 -13 L0 -26 M-10 -24 h20" class="o" fill="none" stroke-width="1.4"/>
  </g>

  <line x1="103" y1="130" x2="59" y2="77" class="a" stroke-width="2.4" marker-end="url(#ar-a)"/>
  <line x1="120" y1="150" x2="120" y2="77" class="s dash"/>
  <line x1="120" y1="77"  x2="63"  y2="77" class="s dash"/>
  <line x1="120" y1="166" x2="120" y2="212" class="b" stroke-width="2.4" marker-end="url(#ar-b)"/>

  <path d="M120 116 A 34 34 0 0 0 98 124" class="s" fill="none"/>
  <text x="127" y="122" class="g">φ</text>

  <text x="50"  y="40" class="mid t">portance</text>
  <text x="50"  y="29" class="mid g">⟂ aux ailes</text>
  <text x="95"  y="68" class="mid g">force centripète</text>
  <text x="127" y="98" class="g">verticale</text>
  <text x="127" y="109" class="g">= poids</text>
  <text x="120" y="230" class="mid t">poids</text>

  <line x1="196" y1="28" x2="196" y2="216" class="s"/>

  <g transform="translate(206,48)">
    <text x="0" y="0" class="t">n = 1 / cos φ</text>
    <text x="0" y="26" class="g">30° → 1,15 g → Vs × 1,07</text>
    <text x="0" y="44" class="g">45° → 1,41 g → Vs × 1,19</text>
    <text x="0" y="62" class="wf" style="font-weight:700">60° → 2,00 g → Vs × 1,41</text>
    <text x="0" y="80" class="kf" style="font-weight:700">75° → 3,86 g → Vs × 1,97</text>
    <text x="0" y="110" class="g">Le palonnier ne fait pas</text>
    <text x="0" y="124" class="g">virer l'avion : il tient</text>
    <text x="0" y="138" class="g">la symétrie du vol.</text>
    <text x="0" y="162" class="g">L'aile intérieure décroche</text>
    <text x="0" y="176" class="g">en premier — d'où la vrille.</text>
  </g>
</svg>`);

Figs.add('domaine-vn', 'principes-vol',
"Le domaine de vol (diagramme V-n)",
"À gauche, la limite est le décrochage ; à droite, la structure. Sous Va, l'avion décroche avant de casser : c'est pourquoi Va est la vitesse à ne pas dépasser en air turbulent ou en manœuvre brutale.",
`<svg viewBox="0 0 360 230" role="img" aria-label="Diagramme du domaine de vol V-n">
  <line x1="46" y1="16" x2="46" y2="200" class="s"/>
  <line x1="46" y1="130" x2="344" y2="130" class="s"/>
  <text x="46" y="10" class="mid g">n (g)</text>
  <text x="344" y="216" class="end g">vitesse</text>

  <path d="M46 130 C110 130 150 78 168 44 L300 44 L300 130 Z" class="fill"/>
  <path d="M46 130 C90 130 128 158 150 176 L300 176 L300 130" class="fill"/>

  <path d="M46 130 C110 130 150 78 168 44" class="a" fill="none"/>
  <path d="M168 44 H300" class="a" fill="none"/>
  <path d="M46 130 C90 130 128 158 150 176" class="b" fill="none"/>
  <path d="M150 176 H300" class="b" fill="none"/>
  <path d="M300 44 V176" class="k"/>

  <line x1="168" y1="44" x2="168" y2="196" class="s dash"/>
  <line x1="234" y1="44" x2="234" y2="196" class="s dash"/>

  <text x="42" y="48" class="end g">+3,8</text>
  <text x="42" y="134" class="end g">1</text>
  <text x="42" y="180" class="end g">−1,5</text>

  <text x="168" y="210" class="mid t">Va</text>
  <text x="234" y="210" class="mid t">Vno</text>
  <text x="300" y="210" class="mid kf" style="font-weight:700">Vne</text>

  <text x="104" y="100" class="g">décrochage</text>
  <text x="228" y="70" class="mid g">domaine de vol</text>
  <text x="266" y="160" class="mid wf">arc jaune : air calme</text>
  <text x="168" y="32" class="mid g">masse ↓ → Va ↓</text>
</svg>`);

/* ═══════════════ MOTEUR ═══════════════ */

Figs.add('cycle-4t', 'moteur',
"Le cycle à quatre temps",
"Deux tours de vilebrequin pour un cycle complet : un seul des quatre temps produit de la puissance. L'étincelle vient de <b>deux magnétos</b> indépendantes du circuit électrique — le moteur tourne même batterie coupée.",
`<svg viewBox="0 0 360 200" role="img" aria-label="Les quatre temps du moteur à pistons">
  <g class="o" fill="none" stroke-width="1.3">
    <path d="M12 52 a8 8 0 0 1 8 -8 h58 a8 8 0 0 1 8 8 v84 h-74 z"/>
    <line x1="12" y1="66" x2="86" y2="66"/>
  </g>
  <path d="M26 46 l7 20 l7 -20" class="a" fill="none" stroke-width="2"/>
  <path d="M58 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <rect x="18" y="100" width="62" height="18" rx="3" class="fill o"/>
  <line x1="49" y1="118" x2="49" y2="132" class="o"/>
  <line x1="49" y1="62" x2="49" y2="92" class="a" marker-end="url(#ar-a)"/>
  <text x="49" y="152" class="mid t">1 · Admission</text>
  <text x="49" y="166" class="mid g">aspiration</text>
  <g class="o" fill="none" stroke-width="1.3">
    <path d="M100 52 a8 8 0 0 1 8 -8 h58 a8 8 0 0 1 8 8 v84 h-74 z"/>
    <line x1="100" y1="66" x2="174" y2="66"/>
  </g>
  <path d="M114 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <path d="M146 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <rect x="106" y="70" width="62" height="18" rx="3" class="fill o"/>
  <line x1="137" y1="88" x2="137" y2="132" class="o"/>
  <line x1="137" y1="96" x2="137" y2="66" class="b" marker-end="url(#ar-b)"/>
  <text x="137" y="152" class="mid t">2 · Compression</text>
  <text x="137" y="166" class="mid g">tout est fermé</text>
  <g class="o" fill="none" stroke-width="1.3">
    <path d="M188 52 a8 8 0 0 1 8 -8 h58 a8 8 0 0 1 8 8 v84 h-74 z"/>
    <line x1="188" y1="66" x2="262" y2="66"/>
  </g>
  <path d="M202 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <path d="M234 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <rect x="194" y="66" width="62" height="18" rx="3" class="fill o"/>
  <line x1="225" y1="84" x2="225" y2="132" class="o"/>
  <line x1="225" y1="92" x2="225" y2="118" class="w" marker-end="url(#ar-w)"/>
  <text x="225" y="152" class="mid t">3 · Détente</text>
  <text x="225" y="166" class="mid g">étincelle</text>
  <g class="o" fill="none" stroke-width="1.3">
    <path d="M276 52 a8 8 0 0 1 8 -8 h58 a8 8 0 0 1 8 8 v84 h-74 z"/>
    <line x1="276" y1="66" x2="350" y2="66"/>
  </g>
  <path d="M290 46 l7 14 l7 -14" class="o" fill="none" stroke-width="1.3"/>
  <path d="M322 46 l7 20 l7 -20" class="b" fill="none" stroke-width="2"/>
  <rect x="282" y="78" width="62" height="18" rx="3" class="fill o"/>
  <line x1="313" y1="96" x2="313" y2="132" class="o"/>
  <line x1="313" y1="100" x2="313" y2="70" class="b" marker-end="url(#ar-b)"/>
  <text x="313" y="152" class="mid t">4 · Échappement</text>
  <text x="313" y="166" class="mid g">gaz évacués</text>

  <circle cx="225" cy="58" r="3.5" class="wf"/>
  <path d="M216 52 l-7 -6 M234 52 l7 -6" class="w" stroke-width="1.6"/>
  <text x="225" y="180" class="mid wf">temps moteur</text>

  <text x="49"  y="40" class="mid af">mélange</text>
  <text x="313" y="40" class="mid bf">gaz brûlés</text>

  <text x="180" y="196" class="mid g">A · C · D · É — deux tours de vilebrequin par cycle complet</text>
</svg>`);

Figs.add('carbu-givrage', 'moteur',
"Le givrage du carburateur",
"La détente dans le venturi et l'évaporation du carburant font chuter la température de 20 à 30 °C : le givre se forme donc par <b>temps doux et humide</b>, et surtout papillon fermé, en descente.",
`<svg viewBox="0 0 360 220" role="img" aria-label="Coupe d'un carburateur et zone de formation du givre">
  <path d="M40 44 H150 C168 44 172 66 186 66 C200 66 204 44 222 44 H300 V132 H222
           C204 132 200 110 186 110 C172 110 168 132 150 132 H40 Z" class="fill o"/>

  <line x1="14" y1="88" x2="50" y2="88" class="b" marker-end="url(#ar-b)"/>
  <text x="14" y="76" class="g">air +15 °C</text>

  <line x1="306" y1="88" x2="344" y2="88" class="a" marker-end="url(#ar-a)"/>
  <text x="344" y="76" class="end g">vers les cylindres</text>

  <text x="186" y="34" class="mid t">venturi</text>
  <text x="186" y="152" class="mid g">l'air se détend : −20 à −30 °C</text>

  <line x1="186" y1="110" x2="186" y2="168" class="s dash"/>
  <circle cx="186" cy="176" r="8" class="fill o"/>
  <text x="186" y="200" class="mid g">gicleur — le carburant s'évapore</text>

  <g class="kf">
    <path d="M170 68 q8 6 16 0 q8 -6 16 0 v6 q-8 6 -16 0 q-8 6 -16 0 Z"/>
    <path d="M170 102 q8 -6 16 0 q8 6 16 0 v-6 q-8 -6 -16 0 q-8 -6 -16 0 Z"/>
  </g>
  <text x="232" y="86" class="kf" style="font-weight:700">givre</text>

  <text x="344" y="176" class="end wf">risque maximal : +10 à +20 °C</text>
  <text x="344" y="190" class="end g">et papillon fermé, en descente</text>
  <text x="16"  y="176" class="g">domaine complet :</text>
  <text x="16"  y="190" class="g">−10 à +30 °C</text>
</svg>`);

/* ═══════════════ INSTRUMENTS ═══════════════ */

Figs.add('pitot-statique', 'instruments',
"Le circuit anémobarométrique",
"L'anémomètre est le seul instrument à recevoir <b>les deux</b> pressions. D'où le diagnostic : trois instruments faux → statique bouchée ; seul l'anémomètre faux → Pitot bouché.",
`<svg viewBox="0 0 360 230" role="img" aria-label="Circuit Pitot statique et instruments alimentés">
  <path d="M18 60 h26 a8 8 0 0 1 8 8 a8 8 0 0 1 -8 8 h-26 z" class="af"/>
  <text x="18" y="50" class="t">Pitot</text>
  <text x="18" y="90" class="g">pression totale</text>

  <circle cx="30" cy="150" r="7" class="bf"/>
  <text x="18" y="132" class="t">Statique</text>
  <text x="18" y="180" class="g">pression statique</text>

  <path d="M52 68 C120 68 130 92 176 92" class="a" fill="none"/>
  <path d="M40 150 C120 150 120 108 176 108" class="b" fill="none"/>
  <path d="M96 150 C96 60 140 40 176 40" class="b" fill="none"/>
  <path d="M120 150 C120 190 150 196 176 196" class="b" fill="none"/>

  <g class="o fill">
    <circle cx="212" cy="100" r="30"/>
    <circle cx="212" cy="40"  r="26"/>
    <circle cx="212" cy="196" r="26"/>
  </g>

  <text x="212" y="96"  class="mid t">ANÉMO</text>
  <text x="212" y="110" class="mid g">totale − stat.</text>
  <text x="212" y="38"  class="mid t">ALTI</text>
  <text x="212" y="50"  class="mid g">statique</text>
  <text x="212" y="194" class="mid t">VARIO</text>
  <text x="212" y="206" class="mid g">statique</text>

  <g transform="translate(252,26)">
    <text x="0" y="0"  class="t">Si ça se bouche</text>
    <text x="0" y="20" class="g">Pitot seul :</text>
    <text x="0" y="32" class="g">anémo → 0</text>
    <text x="0" y="52" class="g">Pitot + drain :</text>
    <text x="0" y="64" class="g">anémo suit l'altitude</text>
    <text x="0" y="84" class="kf">Statique :</text>
    <text x="0" y="96" class="g">alti figé, vario à 0,</text>
    <text x="0" y="108" class="g">anémo faux</text>
    <text x="0" y="128" class="af">→ statique secours</text>
  </g>
</svg>`);

Figs.add('anemo-arcs', 'instruments',
"Les arcs de l'anémomètre",
"L'arc blanc commence <b>sous</b> l'arc vert : la preuve visuelle que les volets abaissent la vitesse de décrochage.",
`<svg viewBox="0 0 360 210" role="img" aria-label="Cadran d'anémomètre et signification des arcs colorés">
  <circle cx="110" cy="102" r="76" class="fill o"/>
  <circle cx="110" cy="102" r="60" fill="none" class="s"/>

  <path d="M 63 43 A 76 76 0 0 0 51 130" fill="none" stroke="#ffffff" stroke-width="7" opacity=".9"/>
  <path d="M 70 36 A 76 76 0 0 1 178 128" fill="none" stroke="var(--ok)" stroke-width="7"/>
  <path d="M 178 128 A 76 76 0 0 1 150 162" fill="none" stroke="var(--warn)" stroke-width="7"/>
  <path d="M 150 162 A 76 76 0 0 1 138 170" fill="none" stroke="var(--ko)" stroke-width="9"/>

  <line x1="110" y1="102" x2="158" y2="62" class="a" stroke-width="3"/>
  <circle cx="110" cy="102" r="5" class="af"/>
  <text x="110" y="196" class="mid g">kt (IAS)</text>

  <g transform="translate(206,30)">
    <rect x="0" y="-9" width="14" height="8" fill="#ffffff" opacity=".9"/>
    <text x="22" y="0" class="t">Blanc — Vs0 à Vfe</text>
    <text x="22" y="14" class="g">domaine des volets</text>

    <rect x="0" y="35" width="14" height="8" fill="var(--ok)"/>
    <text x="22" y="44" class="t">Vert — Vs1 à Vno</text>
    <text x="22" y="58" class="g">utilisation normale</text>

    <rect x="0" y="79" width="14" height="8" fill="var(--warn)"/>
    <text x="22" y="88" class="t">Jaune — Vno à Vne</text>
    <text x="22" y="102" class="g">air calme uniquement</text>

    <rect x="0" y="123" width="14" height="8" fill="var(--ko)"/>
    <text x="22" y="132" class="t">Rouge — Vne</text>
    <text x="22" y="146" class="g">jamais dépasser</text>
  </g>
</svg>`);

/* ═══════════════ RÉGLEMENTATION ═══════════════ */

Figs.add('espaces', 'reglementation',
"Une coupe verticale de l'espace aérien",
"La question est toujours la même : le VFR est-il admis, faut-il une clairance, qui est séparé de qui ? En <b>E</b>, on entre sans clairance ni radio — mais des IFR contrôlés y circulent.",
`<svg viewBox="0 0 360 250" role="img" aria-label="Coupe verticale des classes d'espace aérien">
  <rect x="52" y="16" width="292" height="34" class="fill"/>
  <rect x="52" y="50" width="292" height="56" class="fill" opacity=".55"/>
  <line x1="52" y1="50" x2="344" y2="50" class="s"/>

  <text x="60" y="36" class="t">A</text>
  <text x="76" y="36" class="g">IFR seul — VFR interdit</text>

  <text x="60" y="72" class="t">E</text>
  <text x="76" y="72" class="g">contrôlé pour l'IFR</text>
  <text x="76" y="86" class="g">VFR : ni clairance ni radio obligatoire</text>

  <rect x="80" y="106" width="150" height="44" class="fill o"/>
  <text x="90" y="124" class="t">TMA — D</text>
  <text x="90" y="138" class="g">clairance obligatoire</text>

  <rect x="106" y="150" width="98" height="56" class="fill o"/>
  <text x="114" y="168" class="t">CTR — D</text>
  <text x="114" y="182" class="g">clairance,</text>
  <text x="114" y="194" class="g">VFR spécial possible</text>

  <text x="248" y="176" class="t">G</text>
  <text x="264" y="176" class="g">non contrôlé</text>
  <text x="248" y="192" class="g">info de vol + alerte</text>
  <text x="248" y="204" class="g">« voir et éviter »</text>

  <path d="M52 206 H344" class="o"/>
  <path d="M120 206 h72 M140 206 v-6 h32 v6" class="o" fill="none"/>
  <text x="156" y="220" class="mid g">aérodrome contrôlé</text>

  <g class="s">
    <line x1="52" y1="16" x2="52" y2="206"/>
    <line x1="46" y1="50" x2="52" y2="50"/>
    <line x1="46" y1="106" x2="52" y2="106"/>
    <line x1="46" y1="206" x2="52" y2="206"/>
  </g>
  <text x="42" y="20"  class="end g">FL 195</text>
  <text x="42" y="53"  class="end g">FL 115</text>
  <text x="42" y="109" class="end g">3 000 ft</text>
  <text x="42" y="209" class="end g">SFC</text>

  <g class="af" transform="translate(276,120)">
    <path d="M0,-7 L0,5 M-8,0 L8,0 M-3,6 L3,6" stroke="var(--ppl)" stroke-width="1.6" fill="none"/>
  </g>
  <text x="276" y="142" class="mid af">VFR</text>
</svg>`);

Figs.add('semi-circulaire', 'reglementation',
"La règle semi-circulaire en VFR",
"Applicable au-dessus de 3 000 ft AMSL. Le « + 500 ft » est la marque du VFR : l'IFR occupe les niveaux ronds, on se glisse au-dessus. Moyen mnémotechnique : <b>Est = impair</b>, les deux commencent par une voyelle.",
`<svg viewBox="0 0 360 220" role="img" aria-label="Règle semi-circulaire : niveaux VFR selon la route magnétique">
  <circle cx="120" cy="110" r="82" class="fill o"/>
  <line x1="120" y1="28" x2="120" y2="192" class="s dash"/>

  <path d="M120 110 L120 28 A 82 82 0 0 1 120 192 Z" class="af" opacity=".14"/>
  <path d="M120 110 L120 192 A 82 82 0 0 1 120 28 Z" class="bf" opacity=".14"/>

  <text x="120" y="22"  class="mid g">000°</text>
  <text x="120" y="206" class="mid g">180°</text>
  <text x="208" y="114" class="mid g">090°</text>
  <text x="32"  y="114" class="mid g">270°</text>

  <text x="160" y="98"  class="mid af" style="font-weight:700">IMPAIRS</text>
  <text x="160" y="114" class="mid g">+ 500 ft</text>
  <text x="80"  y="98"  class="mid bf" style="font-weight:700">PAIRS</text>
  <text x="80"  y="114" class="mid g">+ 500 ft</text>

  <g transform="translate(224,46)">
    <text x="0" y="0"   class="t">Route 000° → 179°</text>
    <text x="0" y="18"  class="af">FL 35 · 55 · 75 · 95</text>
    <text x="0" y="48"  class="t">Route 180° → 359°</text>
    <text x="0" y="66"  class="bf">FL 45 · 65 · 85 · 105</text>
    <text x="0" y="100" class="g">Route <tspan class="t">magnétique</tspan>,</text>
    <text x="0" y="114" class="g">au-dessus de 3 000 ft AMSL.</text>
    <text x="0" y="134" class="g">IFR : niveaux ronds</text>
    <text x="0" y="146" class="g">(FL 30, 40, 50…)</text>
  </g>
</svg>`);

Figs.add('priorites', 'reglementation',
"Les trois rencontres et la règle qui s'applique",
"Et l'ordre de priorité, du moins manœuvrant au plus manœuvrant : <b>ballon, planeur, dirigeable, avion</b>. Un aéronef en détresse passe avant tout le monde.",
`<svg viewBox="0 0 360 200" role="img" aria-label="Règles de priorité : convergence, face à face, dépassement">
  <g class="o" fill="none" stroke-width="1.6">
    <g transform="translate(60,64)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
    <g transform="translate(60,64)"/>
  </g>

  <g stroke-width="1.6" fill="none">
    <g class="a" transform="translate(38,86) rotate(45)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
    <g class="k" transform="translate(96,60) rotate(135)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
  </g>
  <path d="M46 78 L78 46" class="s dash"/>
  <text x="60" y="26" class="mid t">Convergence</text>
  <text x="60" y="116" class="mid g">celui qui a l'autre</text>
  <text x="60" y="128" class="mid g">à sa <tspan class="t">droite</tspan> s'écarte</text>
  <text x="98" y="44" class="kf" style="font-size:9px">prioritaire</text>

  <g stroke-width="1.6" fill="none">
    <g class="a" transform="translate(164,44)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
    <g class="a" transform="translate(196,86) rotate(180)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
  </g>
  <path d="M164 54 q10 12 -4 24" class="a" marker-end="url(#ar-a)" fill="none"/>
  <path d="M196 76 q-10 -12 4 -24" class="a" marker-end="url(#ar-a)" fill="none"/>
  <text x="180" y="26" class="mid t">Face à face</text>
  <text x="180" y="116" class="mid g">chacun dégage</text>
  <text x="180" y="128" class="mid g">vers la <tspan class="t">droite</tspan></text>

  <g stroke-width="1.6" fill="none">
    <g class="o" transform="translate(288,44)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
    <g class="a" transform="translate(288,96)"><path d="M0,-9 L0,7 M-11,0 L11,0 M-4,8 L4,8"/></g>
  </g>
  <path d="M296 92 C320 78 320 58 300 46" class="a" marker-end="url(#ar-a)" fill="none"/>
  <text x="288" y="26" class="mid t">Dépassement</text>
  <text x="288" y="116" class="mid g">on dépasse</text>
  <text x="288" y="128" class="mid g">par la <tspan class="t">droite</tspan></text>

  <line x1="120" y1="20" x2="120" y2="136" class="s"/>
  <line x1="240" y1="20" x2="240" y2="136" class="s"/>

  <text x="180" y="164" class="mid t">Ballon › Planeur › Dirigeable › Avion</text>
  <text x="180" y="180" class="mid g">le plus manœuvrant s'écarte — et l'aéronef en détresse prime sur tous</text>
</svg>`);

Figs.add('feux-nav', 'reglementation',
"Les feux de navigation",
"Comme en marine : <b>rouge à bâbord</b> (gauche), vert à tribord (droite), blanc à l'arrière. Voir du rouge et du vert en même temps, c'est faire face à un aéronef qui vient droit sur vous.",
`<svg viewBox="0 0 360 190" role="img" aria-label="Position et couleur des feux de navigation">
  <g transform="translate(110,92)">
    <g class="o" fill="none" stroke-width="1.6">
      <path d="M0,-46 C6,-36 8,-16 8,4 L8,30 L0,38 L-8,30 L-8,4 C-8,-16 -6,-36 0,-46 Z"/>
      <path d="M-64,10 L-8,-2 L8,-2 L64,10 L64,18 L8,12 L-8,12 L-64,18 Z"/>
      <path d="M-26,32 L-8,26 L8,26 L26,32 L26,37 L0,34 L-26,37 Z"/>
    </g>
    <circle cx="-64" cy="14" r="6" fill="var(--ko)"/>
    <circle cx="64"  cy="14" r="6" fill="var(--ok)"/>
    <circle cx="0"   cy="38" r="5" fill="#ffffff"/>
    <circle cx="0"   cy="-8" r="4" fill="var(--ko)" opacity=".9"/>
  </g>

  <text x="34"  y="132" class="mid kf" style="font-weight:700">ROUGE</text>
  <text x="40"  y="146" class="mid g">bâbord — gauche</text>
  <text x="186" y="132" class="mid" style="fill:var(--ok);font-weight:700">VERT</text>
  <text x="186" y="146" class="mid g">tribord — droite</text>
  <text x="110" y="170" class="mid g">BLANC à l'arrière</text>
  <text x="110" y="182" class="mid g">anticollision rouge sur le dos</text>

  <g transform="translate(216,40)">
    <text x="0" y="0"   class="t">Ce que vous en déduisez</text>
    <text x="0" y="22"  class="g">Rouge seul → il croise</text>
    <text x="0" y="34"  class="g">de gauche à droite</text>
    <text x="0" y="56"  class="g">Vert seul → il croise</text>
    <text x="0" y="68"  class="g">de droite à gauche :</text>
    <text x="0" y="80"  class="af">il a la priorité</text>
    <text x="0" y="102" class="kf" style="font-weight:700">Rouge + vert = de face</text>
    <text x="0" y="116" class="g">→ chacun dégage à droite</text>
  </g>
</svg>`);

Figs.add('circuit-piste', 'reglementation',
"Le tour de piste (main gauche par défaut)",
"1 000 ft AAL en vent arrière, sauf publication contraire sur la VAC. Le numéro de piste est son cap magnétique divisé par 10 et arrondi : cap 265° → piste 27, et 09 dans l'autre sens.",
`<svg viewBox="0 0 360 220" role="img" aria-label="Les branches du tour de piste">
  <g transform="translate(0,4)">
    <rect x="120" y="60" width="26" height="120" rx="2" class="fill o"/>
    <line x1="133" y1="70" x2="133" y2="170" class="s dash"/>
    <text x="133" y="196" class="mid t">27</text>
    <text x="133" y="52"  class="mid g">09</text>

    <path d="M133 176 L133 200" class="s"/>

    <path d="M186 178 L186 62" class="a" fill="none" marker-end="url(#ar-a)"/>
    <path d="M186 62 C186 44 172 36 154 36 L133 36" class="a" fill="none" marker-end="url(#ar-a)"/>
    <path d="M104 36 L86 36 C68 36 60 46 60 62" class="a" fill="none" marker-end="url(#ar-a)"/>
    <path d="M60 62 L60 150" class="a" fill="none" marker-end="url(#ar-a)"/>
    <path d="M60 150 C60 172 74 182 92 182 L112 182" class="a" fill="none" marker-end="url(#ar-a)"/>

    <text x="216" y="120" class="mid g" transform="rotate(-90 216 120)">montée initiale</text>
    <text x="133" y="26"  class="mid t">étape de base opposée</text>
    <text x="34"  y="110" class="t" transform="rotate(-90 34 110)">vent arrière</text>
    <text x="86"  y="200" class="mid t">étape de base</text>
    <text x="186" y="200" class="mid t">finale</text>

    <text x="46" y="66" class="g">1 000 ft AAL</text>

    <g class="a" transform="translate(60,110) rotate(180)" fill="none" stroke-width="1.6">
      <path d="M0,-8 L0,6 M-9,0 L9,0 M-4,7 L4,7"/>
    </g>

    <path d="M264 40 q10 0 10 10 v40 q0 10 -10 10" class="s" fill="none"/>
    <text x="262" y="46"  class="g">circuit à gauche :</text>
    <text x="262" y="60"  class="g">tous les virages</text>
    <text x="262" y="74"  class="g">du même côté,</text>
    <text x="262" y="88"  class="g">terrain visible</text>
    <text x="262" y="112" class="wf">vérifier la VAC :</text>
    <text x="262" y="126" class="g">certains sont</text>
    <text x="262" y="140" class="g">main droite</text>
  </g>
</svg>`);

/* ═══════════════ NAVIGATION ═══════════════ */

Figs.add('triangle-vitesses', 'navigation',
"Le triangle des vitesses",
"Trois vecteurs : la vitesse propre dans l'axe du <b>cap</b>, le vent, et la résultante — la vitesse sol le long de la <b>route</b>. On corrige la dérive en pointant le nez vers le vent.",
`<svg viewBox="0 0 360 220" role="img" aria-label="Triangle des vitesses : cap, vent et route">
  <line x1="40" y1="170" x2="286" y2="170" class="b" stroke-width="2.4" marker-end="url(#ar-b)"/>
  <text x="170" y="190" class="mid t">ROUTE — vitesse sol (GS)</text>
  <text x="170" y="204" class="mid g">ce que fait l'avion par rapport au sol</text>

  <line x1="40" y1="170" x2="248" y2="86" class="a" stroke-width="2.4" marker-end="url(#ar-a)"/>
  <text x="128" y="112" class="mid t" transform="rotate(-22 128 112)">CAP — vitesse propre (TAS)</text>

  <line x1="248" y1="86" x2="286" y2="170" class="w" stroke-width="2.4" marker-end="url(#ar-w)"/>
  <text x="352" y="120" class="end wf" style="font-weight:700">VENT</text>
  <text x="352" y="134" class="end g">direction d'où il vient,</text>
  <text x="352" y="146" class="end g">force en nœuds</text>

  <path d="M74 170 A 34 34 0 0 0 68 158" class="s" fill="none"/>
  <text x="82" y="158" class="g">dérive</text>

  <g transform="translate(30,30)">
    <text x="0" y="0"  class="t">De tête</text>
    <text x="0" y="18" class="g">Dérive max ≈ vent × 60 ÷ TAS</text>
    <text x="0" y="32" class="g">Vent à 30° de la route → moitié · 45° → 0,7 · 60° → 0,9</text>
  </g>
</svg>`);

Figs.add('un-en-60', 'navigation',
"La règle du 1 en 60",
"Décalé de 2 NM après 30 NM : 2 × 60 ÷ 30 = <b>4° d'erreur</b>. On corrige du double (8°) pour rejoindre le point d'arrivée, puis on reprend la correction simple.",
`<svg viewBox="0 0 360 200" role="img" aria-label="Correction de cap avec la règle du 1 en 60">
  <circle cx="40" cy="150" r="5" class="af"/>
  <text x="40" y="176" class="mid t">départ</text>

  <line x1="40" y1="150" x2="330" y2="150" class="s dash"/>
  <text x="330" y="168" class="end g">route prévue</text>
  <circle cx="330" cy="150" r="5" class="bf"/>
  <text x="330" y="140" class="end t">arrivée</text>

  <line x1="40" y1="150" x2="190" y2="112" class="k" stroke-width="2"/>
  <circle cx="190" cy="112" r="4.5" class="kf"/>
  <text x="190" y="102" class="mid kf">position réelle</text>

  <line x1="190" y1="150" x2="190" y2="116" class="k dash"/>
  <text x="200" y="136" class="kf">2 NM d'écart</text>

  <line x1="190" y1="112" x2="330" y2="150" class="a" stroke-width="2" marker-end="url(#ar-a)"/>
  <text x="268" y="120" class="mid af">correction 8°</text>

  <path d="M62 150 A 22 22 0 0 0 60 144" class="s" fill="none"/>
  <text x="70" y="142" class="g">4°</text>

  <text x="115" y="166" class="mid g">30 NM parcourus</text>

  <g transform="translate(30,32)">
    <text x="0" y="0"  class="t">1° d'erreur = 1 NM d'écart après 60 NM</text>
    <text x="0" y="18" class="g">erreur (°) = écart (NM) × 60 ÷ distance parcourue (NM)</text>
  </g>
</svg>`);

Figs.add('chaine-caps', 'navigation',
"De la route tracée au cap au compas",
"Trois corrections successives, toujours dans cet ordre. Déclinaison <b>ouest</b> : le cap magnétique est le plus grand. La dérive se corrige en pointant le nez vers le vent.",
`<svg viewBox="0 0 360 170" role="img" aria-label="Chaîne de conversion route vraie vers cap compas">
  <g class="fill o">
    <rect x="14"  y="56" width="66" height="34" rx="6"/>
    <rect x="106" y="56" width="66" height="34" rx="6"/>
    <rect x="198" y="56" width="66" height="34" rx="6"/>
    <rect x="286" y="56" width="60" height="34" rx="6"/>
  </g>
  <text x="47"  y="78" class="mid t">Rv</text>
  <text x="139" y="78" class="mid t">Cv</text>
  <text x="231" y="78" class="mid t">Cm</text>
  <text x="316" y="78" class="mid t">Cc</text>

  <text x="47"  y="106" class="mid g">route vraie</text>
  <text x="139" y="106" class="mid g">cap vrai</text>
  <text x="231" y="106" class="mid g">cap magnétique</text>
  <text x="316" y="106" class="mid g">cap compas</text>

  <line x1="82"  y1="73" x2="102" y2="73" class="a" marker-end="url(#ar-a)"/>
  <line x1="174" y1="73" x2="194" y2="73" class="a" marker-end="url(#ar-a)"/>
  <line x1="266" y1="73" x2="282" y2="73" class="a" marker-end="url(#ar-a)"/>

  <text x="92"  y="42" class="mid af">dérive</text>
  <text x="92"  y="30" class="mid g">le vent</text>
  <text x="184" y="42" class="mid af">déclinaison</text>
  <text x="184" y="30" class="mid g">la carte</text>
  <text x="274" y="42" class="mid af">déviation</text>
  <text x="274" y="30" class="mid g">l'avion</text>

  <text x="180" y="140" class="mid g">Route = trajectoire sol · Cap = direction du nez</text>
  <text x="180" y="156" class="mid g">L'écart entre les deux, c'est la dérive.</text>
</svg>`);

/* ═══════════════ MÉTÉOROLOGIE ═══════════════ */

Figs.add('fronts', 'meteo',
"Coupe d'une perturbation : front froid et front chaud",
"Le front chaud, en pente douce, annonce sa venue des heures à l'avance : cirrus, puis plafond qui s'abaisse et pluie continue. Le front froid, en pente raide, frappe vite et fort — mais il est suivi d'une traîne lumineuse.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Coupe verticale d'une perturbation avec front froid et front chaud">
  <line x1="14" y1="196" x2="348" y2="196" class="o"/>

  <path d="M348 66 L232 196" class="k" stroke-width="2"/>
  <path d="M150 196 L112 54" class="b" stroke-width="2"/>

  <g class="fill" opacity=".95" stroke="var(--line)">
    <ellipse cx="322" cy="58"  rx="24" ry="6"/>
    <ellipse cx="292" cy="76"  rx="30" ry="9"/>
    <ellipse cx="262" cy="104" rx="34" ry="13"/>
    <ellipse cx="248" cy="140" rx="32" ry="18"/>
  </g>
  <text x="330" y="44" class="end g">cirrus</text>
  <text x="300" y="92" class="end g">altostratus</text>
  <text x="248" y="144" class="mid g">nimbostratus</text>

  <g class="s" opacity=".8">
    <path d="M228 158 v34 M240 158 v34 M252 158 v34 M264 156 v36 M276 152 v40"/>
  </g>
  <text x="264" y="212" class="mid g">pluie continue</text>

  <g class="fill" opacity="1" stroke="var(--line)">
    <path d="M78 52 h72 a10 10 0 0 1 0 10 h-72 a10 10 0 0 1 0 -10 Z"/>
    <ellipse cx="118" cy="96" rx="30" ry="34"/>
    <ellipse cx="96"  cy="112" rx="20" ry="22"/>
    <ellipse cx="140" cy="112" rx="18" ry="20"/>
  </g>
  <text x="118" y="34" class="mid kf" style="font-weight:700">CUMULONIMBUS</text>
  <g class="k" opacity=".9">
    <path d="M100 138 l-6 22 M114 140 l-6 22 M128 138 l-6 22"/>
  </g>
  <text x="106" y="212" class="mid g">averses, grains</text>

  <g class="fill" opacity=".95" stroke="var(--line)">
    <ellipse cx="40" cy="120" rx="16" ry="8"/>
    <ellipse cx="66" cy="132" rx="12" ry="6"/>
  </g>
  <text x="46" y="212" class="mid g">traîne</text>

  <text x="188" y="212" class="mid g">secteur chaud</text>
  <text x="40"  y="176" class="mid bf" style="font-weight:700">air froid</text>
  <text x="190" y="176" class="mid wf" style="font-weight:700">air chaud</text>
  <text x="308" y="176" class="mid bf" style="font-weight:700">air froid</text>

  <text x="182" y="72"  class="mid t">front froid</text>
  <text x="316" y="112" class="mid t">front chaud</text>

  <line x1="120" y1="230" x2="210" y2="230" class="a" marker-end="url(#ar-a)"/>
  <text x="165" y="226" class="mid g">déplacement</text>
</svg>`);

Figs.add('nuages', 'meteo',
"Les trois étages de nuages",
"Deux familles : <b>cumuliforme</b> en bourgeons — instabilité, averses, turbulence ; <b>stratiforme</b> en couches — stabilité, pluie continue, mauvaise visibilité. <b>Nimbo</b> ou <b>-nimbus</b> signale la pluie.",
`<svg viewBox="0 0 360 250" role="img" aria-label="Classification des nuages par étages">
  <line x1="58" y1="16" x2="58" y2="216" class="s"/>
  <line x1="58" y1="216" x2="344" y2="216" class="o"/>
  <line x1="58" y1="80"  x2="344" y2="80"  class="s dash"/>
  <line x1="58" y1="150" x2="344" y2="150" class="s dash"/>

  <text x="52" y="20"  class="end g">13 km</text>
  <text x="52" y="84"  class="end g">7 km</text>
  <text x="52" y="154" class="end g">2 km</text>
  <text x="52" y="219" class="end g">sol</text>

  <text x="66" y="36" class="t">Étage supérieur — « cirro »</text>
  <text x="66" y="50" class="g">cirrus, cirrostratus, cirrocumulus</text>
  <text x="66" y="62" class="g">cristaux de glace</text>
  <g class="s" opacity=".9">
    <path d="M196 68 q12 -8 26 -2 M228 72 q14 -8 28 -3"/>
  </g>

  <text x="66" y="102" class="t">Étage moyen — « alto »</text>
  <text x="66" y="116" class="g">altostratus, altocumulus</text>
  <g class="fill" opacity=".9" stroke="var(--line)">
    <ellipse cx="212" cy="128" rx="26" ry="7"/>
    <ellipse cx="252" cy="124" rx="14" ry="6"/>
  </g>

  <text x="66" y="170" class="t">Étage inférieur</text>
  <text x="66" y="184" class="g">stratus, stratocumulus, cumulus</text>
  <text x="66" y="196" class="g">nimbostratus : la pluie continue</text>
  <g class="fill" opacity=".9" stroke="var(--line)">
    <ellipse cx="218" cy="204" rx="28" ry="8"/>
  </g>

  <g class="fill o" opacity=".9">
    <path d="M288 216 C288 150 294 62 312 44 C330 62 336 150 336 216 Z"/>
  </g>
  <path d="M284 36 h56 a8 8 0 0 1 0 9 h-56 a8 8 0 0 1 0 -9 Z" class="kf" opacity=".85"/>
  <text x="312" y="28" class="mid kf" style="font-weight:700">CB</text>
  <text x="180" y="238" class="mid g">le cumulonimbus traverse les trois étages — évitement 20 NM</text>
</svg>`);

Figs.add('orage', 'meteo',
"Le cumulonimbus et ses dangers",
"Au stade de maturité, ascendances et rabattants coexistent. La grêle peut être projetée <b>hors</b> du nuage sous l'enclume, et le front de rafales précède l'orage de plusieurs kilomètres.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Dangers associés à un cumulonimbus">
  <line x1="14" y1="206" x2="348" y2="206" class="o"/>

  <g class="fill o" opacity=".95">
    <path d="M120 206 C114 148 124 96 150 76 C170 60 200 60 220 76 C246 96 252 148 248 206 Z"/>
    <ellipse cx="184" cy="70" rx="74" ry="13"/>
  </g>

  <line x1="166" y1="196" x2="166" y2="96" class="a" marker-end="url(#ar-a)"/>
  <text x="160" y="150" class="mid af" transform="rotate(-90 160 150)">ascendance</text>

  <line x1="216" y1="110" x2="216" y2="198" class="k" marker-end="url(#ar-k)"/>
  <text x="226" y="150" class="kf" transform="rotate(90 226 150)">rabattant</text>

  <path d="M150 120 l-10 24 h12 l-10 24" class="w" fill="none" stroke-width="2.2"/>

  <g class="s" opacity=".9">
    <path d="M138 206 v-8 M150 208 v-10 M198 208 v-10 M232 206 v-8"/>
  </g>

  <text x="14" y="96"  class="t">givrage massif</text>
  <text x="14" y="109" class="g">eau surfondue</text>
  <path d="M92 100 l30 6" class="s dash"/>

  <text x="14" y="150" class="t">foudre</text>
  <text x="14" y="163" class="g">et turbulence sévère</text>
  <path d="M112 152 l24 -8" class="s dash"/>

  <text x="346" y="38"  class="end kf" style="font-weight:700">grêle</text>
  <text x="346" y="51"  class="end g">projetée sous l'enclume</text>
  <path d="M300 56 l-42 10" class="k dash"/>

  <text x="346" y="126" class="end t">cisaillement</text>
  <text x="346" y="139" class="end g">et rabattants violents</text>

  <path d="M248 200 C272 200 292 202 312 204" class="w" marker-end="url(#ar-w)" fill="none"/>
  <text x="300" y="192" class="mid wf">front de rafales</text>

  <line x1="20" y1="228" x2="112" y2="228" class="k" marker-end="url(#ar-k)"/>
  <line x1="112" y1="222" x2="112" y2="234" class="k"/>
  <text x="64"  y="222" class="mid kf" style="font-weight:700">20 NM minimum</text>
  <text x="234" y="228" class="mid g">jamais par-dessous, jamais sous l'enclume</text>
</svg>`);

/* ═══════════════ MASSE ET PERFORMANCES ═══════════════ */

Figs.add('centrage', 'performances',
"L'enveloppe de centrage",
"Être sous la masse maximale ne suffit pas : le point doit tomber <b>dans</b> le domaine, au décollage comme à l'atterrissage — la consommation du carburant déplace le centre de gravité.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Enveloppe de centrage masse et position du centre de gravité">
  <line x1="60" y1="20" x2="60" y2="190" class="s"/>
  <line x1="60" y1="190" x2="330" y2="190" class="s"/>
  <text x="60" y="14" class="mid g">masse (kg)</text>
  <text x="330" y="208" class="end g">position du CG</text>

  <path d="M104 176 L104 106 L136 52 L246 52 L246 176 Z" class="fill a" opacity=".9"/>
  <text x="176" y="98" class="mid af" style="font-weight:700">domaine autorisé</text>

  <line x1="60" y1="52" x2="330" y2="52" class="k dash"/>
  <text x="334" y="49" class="end kf">MTOM</text>

  <circle cx="200" cy="70" r="5" class="bf"/>
  <text x="208" y="66" class="t">décollage</text>
  <circle cx="164" cy="140" r="5" class="bf"/>
  <text x="172" y="136" class="t">atterrissage</text>
  <path d="M197 75 C182 96 172 118 166 133" class="b dash"/>

  <text x="104" y="204" class="mid g">limite avant</text>
  <text x="246" y="204" class="mid g">limite arrière</text>

  <g transform="translate(60,222)">
    <text x="0" y="0" class="g">CG = Σ (masse × bras de levier) ÷ Σ masses</text>
  </g>

  <g transform="translate(266,84)">
    <text x="0" y="0"  class="t">Avant</text>
    <text x="0" y="13" class="g">stable, Vs ↑,</text>
    <text x="0" y="25" class="g">rotation dure</text>
    <text x="0" y="48" class="kf" style="font-weight:700">Arrière</text>
    <text x="0" y="61" class="g">instable,</text>
    <text x="0" y="73" class="g">sortie de</text>
    <text x="0" y="85" class="g">décrochage</text>
    <text x="0" y="97" class="g">compromise</text>
  </g>
</svg>`);

Figs.add('vent-travers', 'performances',
"Décomposer le vent par rapport à la piste",
"Le complément donne la composante de face : à 60°, il ne reste que la moitié du vent pour raccourcir le décollage — mais 90 % en travers.",
`<svg viewBox="0 0 360 220" role="img" aria-label="Composantes de face et de travers du vent par rapport à l'axe de piste">
  <rect x="96" y="40" width="28" height="150" rx="2" class="fill o"/>
  <line x1="110" y1="50" x2="110" y2="180" class="s dash"/>
  <text x="110" y="206" class="mid t">27</text>

  <line x1="110" y1="120" x2="188" y2="66" class="w" stroke-width="2.4" marker-end="url(#ar-w)"/>
  <text x="196" y="60" class="wf" style="font-weight:700">vent 20 kt</text>

  <line x1="110" y1="120" x2="110" y2="66" class="a dash"/>
  <line x1="110" y1="66"  x2="188" y2="66" class="k dash"/>
  <text x="104" y="94"  class="end af">face</text>
  <text x="150" y="58"  class="mid kf">travers</text>

  <path d="M110 96 A 24 24 0 0 0 126 104" class="s" fill="none"/>
  <text x="126" y="112" class="g">35°</text>

  <g transform="translate(210,96)">
    <text x="0" y="0"   class="t">Règle des sinus</text>
    <text x="0" y="20"  class="g">30°  →  ½ du vent</text>
    <text x="0" y="36"  class="g">45°  →  0,7 du vent</text>
    <text x="0" y="52"  class="g">60°  →  0,9 du vent</text>
    <text x="0" y="68"  class="g">90°  →  tout le vent</text>
    <text x="0" y="94"  class="wf">20 kt à 30° = 10 kt travers</text>
  </g>

  <text x="30" y="186" class="g">composante</text>
  <text x="30" y="198" class="g">de face</text>
</svg>`);

/* ═══════════════ PROCÉDURES ET URGENCES ═══════════════ */

Figs.add('panne-moteur', 'procedures',
"Panne moteur : l'ordre des actions",
"La vitesse d'abord : sans elle, rien d'autre ne compte. Puis le terrain, et seulement ensuite les causes. Et jamais de demi-tour vers la piste juste après le décollage — à basse hauteur, le virage tue.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Trajectoire et actions après une panne moteur">
  <line x1="150" y1="206" x2="350" y2="206" class="o"/>
  <path d="M214 206 h104 v-9 h-104 z" class="fill a" opacity=".75"/>
  <text x="266" y="224" class="mid af">terrain face au vent</text>

  <g class="a" transform="translate(166,34)" fill="none" stroke-width="1.6">
    <path d="M-11,0 h22 M0,-7 v14 M9,-6 v12"/>
  </g>
  <path d="M176 42 C206 74 232 130 244 196" class="a dash" fill="none" marker-end="url(#ar-a)"/>
  <text x="196" y="76" class="g">plané à la</text>
  <text x="196" y="88" class="g">finesse max</text>

  <line x1="344" y1="180" x2="304" y2="180" class="w" marker-end="url(#ar-w)"/>
  <text x="344" y="170" class="end wf">vent</text>

  <line x1="140" y1="16" x2="140" y2="228" class="s"/>

  <g transform="translate(14,26)">
    <text x="0" y="0"   class="t">1 · Vitesse de plané</text>
    <text x="0" y="13"  class="g">assiette, puis compenser</text>
    <text x="0" y="38"  class="t">2 · Terrain</text>
    <text x="0" y="51"  class="g">face au vent, dégagé, long</text>
    <text x="0" y="76"  class="t">3 · Causes</text>
    <text x="0" y="89"  class="g">carburant · allumage · air</text>
    <text x="0" y="114" class="t">4 · Radio</text>
    <text x="0" y="127" class="g">121,5 · 7700 · MAYDAY</text>
    <text x="0" y="152" class="kf" style="font-weight:700">5 · Sécurité</text>
    <text x="0" y="165" class="g">harnais serrés, robinet et</text>
    <text x="0" y="178" class="g">contact coupés, portes</text>
    <text x="0" y="191" class="g">déverrouillées</text>
  </g>
</svg>`);

/* ═══════════════ FACTEURS HUMAINS ═══════════════ */

Figs.add('fromage-suisse', 'facteurs-humains',
"Le modèle du fromage suisse (Reason)",
"Un accident n'a jamais une cause unique : c'est l'alignement de plusieurs failles. D'où l'intérêt de rompre la chaîne <b>le plus tôt possible</b> — une seule barrière rétablie suffit.",
`<svg viewBox="0 0 360 224" role="img" aria-label="Modèle du fromage suisse : alignement des défaillances">
  <g class="fill o">
    <path d="M40 30 l30 -14 v112 l-30 14 z"/>
    <path d="M112 30 l30 -14 v112 l-30 14 z"/>
    <path d="M184 30 l30 -14 v112 l-30 14 z"/>
    <path d="M256 30 l30 -14 v112 l-30 14 z"/>
  </g>

  <g fill="var(--bg)">
    <ellipse cx="55"  cy="86" rx="7" ry="10"/>
    <ellipse cx="127" cy="86" rx="7" ry="10"/>
    <ellipse cx="199" cy="86" rx="7" ry="10"/>
    <ellipse cx="271" cy="86" rx="7" ry="10"/>
    <ellipse cx="52"  cy="46" rx="5" ry="7" opacity=".9"/>
    <ellipse cx="130" cy="120" rx="5" ry="7" opacity=".9"/>
    <ellipse cx="196" cy="50" rx="5" ry="7" opacity=".9"/>
  </g>

  <line x1="18" y1="86" x2="320" y2="86" class="k" stroke-width="2.4" marker-end="url(#ar-k)"/>
  <text x="330" y="82" class="end kf" style="font-weight:700">accident</text>

  <text x="55"  y="176" class="mid g">préparation</text>
  <text x="127" y="176" class="mid g">décision</text>
  <text x="199" y="176" class="mid g">pilotage</text>
  <text x="271" y="176" class="mid g">dernière</text>
  <text x="271" y="188" class="mid g">barrière</text>
  <text x="55"  y="188" class="mid g">du vol</text>

  <text x="180" y="202" class="mid g">Chaque tranche est une défense : météo étudiée,</text>
  <text x="180" y="214" class="mid g">critères fixés, briefing, checklists, demi-tour.</text>
</svg>`);

/* ═══════════════ PRÉPARATION DU VOL ═══════════════ */

Figs.add('carburant', 'preparation',
"Le carburant d'un vol VFR",
"On ne décolle jamais avec « le voyage » seul. La <b>réserve finale</b> ne se consomme pas : si l'on doit l'entamer, c'est qu'on aurait dû se poser avant.",
`<svg viewBox="0 0 360 200" role="img" aria-label="Répartition réglementaire du carburant d'un vol VFR">
  <g>
    <rect x="20"  y="46" width="26"  height="40" class="fill o"/>
    <rect x="46"  y="46" width="128" height="40" class="af" opacity=".8"/>
    <rect x="174" y="46" width="66"  height="40" class="bf" opacity=".75"/>
    <rect x="240" y="46" width="56"  height="40" class="wf" opacity=".8"/>
    <rect x="296" y="46" width="44"  height="40" class="kf" opacity=".75"/>
  </g>

  <text x="33"  y="102" class="mid g">roulage</text>
  <text x="110" y="102" class="mid t">voyage</text>
  <text x="207" y="102" class="mid t">dégagement</text>
  <text x="268" y="102" class="mid t">réserve</text>
  <text x="268" y="114" class="mid t">de route</text>
  <text x="318" y="102" class="mid kf" style="font-weight:700">finale</text>

  <text x="110" y="122" class="mid g">départ → arrivée</text>
  <text x="207" y="122" class="mid g">vers le dégagement</text>
  <text x="318" y="122" class="mid g">30 min</text>
  <text x="318" y="134" class="mid g">de jour</text>

  <line x1="20" y1="34" x2="340" y2="34" class="s"/>
  <text x="180" y="26" class="mid t">Ce qu'il y a dans les réservoirs au décollage</text>

  <g transform="translate(20,152)">
    <text x="0" y="0"  class="g">On raisonne en <tspan class="t">temps de vol restant</tspan>, pas en litres :</text>
    <text x="0" y="16" class="g">les jauges d'un avion léger ne sont fiables qu'à zéro.</text>
    <text x="0" y="34" class="wf">Entamer la réserve finale se déclare — MAYDAY FUEL.</text>
  </g>
</svg>`);

/* ═══════════════ CELLULE ═══════════════ */

Figs.add('prevol', 'cellule',
"La visite prévol : une boucle, toujours la même",
"Le sens de la boucle importe peu, sa <b>constance</b> est tout : c'est elle qui fait remarquer ce qui a changé depuis la dernière fois. Une prévol interrompue se reprend au début.",
`<svg viewBox="0 0 360 240" role="img" aria-label="Parcours de la visite prévol autour de l'avion">
  <g transform="translate(180,116)">
    <g class="o" fill="none" stroke-width="1.5">
      <path d="M0,-64 C7,-50 10,-22 10,4 L10,44 L0,54 L-10,44 L-10,4 C-10,-22 -7,-50 0,-64 Z"/>
      <path d="M-86,10 L-10,-4 L10,-4 L86,10 L86,20 L10,14 L-10,14 L-86,20 Z"/>
      <path d="M-32,46 L-10,38 L10,38 L32,46 L32,52 L0,48 L-32,52 Z"/>
      <line x1="-14" y1="-64" x2="14" y2="-64" stroke-width="2.5"/>
    </g>
  </g>

  <path d="M180 26 C246 26 300 54 300 96 C300 140 250 160 214 176
           C196 184 164 184 146 176 C110 160 60 140 60 96 C60 54 114 26 180 26"
        class="a dash" fill="none" marker-end="url(#ar-a)"/>

  <g class="af" stroke="var(--bg-2)" stroke-width="2.5">
    <circle cx="180" cy="26"  r="9"/><circle cx="266" cy="46"  r="9"/>
    <circle cx="300" cy="104" r="9"/><circle cx="214" cy="176" r="9"/>
    <circle cx="146" cy="176" r="9"/><circle cx="60"  cy="104" r="9"/>
    <circle cx="94"  cy="46"  r="9"/>
  </g>
  <g class="mid" style="fill:var(--bg);font-weight:700;font-size:10px">
    <text x="180" y="30">1</text><text x="266" y="50">2</text>
    <text x="300" y="108">3</text><text x="214" y="180">4</text>
    <text x="146" y="180">5</text><text x="60"  y="108">6</text>
    <text x="94"  y="50">7</text>
  </g>

  <text x="180" y="14"  class="mid g">1 · hélice, capot, entrées d'air, niveau d'huile</text>
  <text x="352" y="30"  class="end g">2 · aile droite, feux, gouvernes</text>
  <text x="352" y="132" class="end g">3 · purge, jauge, train</text>
  <text x="266" y="206" class="mid g">4 · empennage, gouvernes libres</text>
  <text x="100" y="206" class="mid g">5 · antennes, statiques</text>
  <text x="8"   y="132" class="g">6 · Pitot dégagé,</text>
  <text x="8"   y="144" class="g">cache retiré</text>
  <text x="8"   y="30"  class="g">7 · aile gauche,</text>
  <text x="8"   y="42"  class="g">purge, état de surface</text>

  <text x="180" y="228" class="mid wf">Givre, neige ou gelée blanche sur l'aile : aucune tolérance.</text>
</svg>`);
