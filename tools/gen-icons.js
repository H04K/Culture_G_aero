#!/usr/bin/env node
/* Génère les icônes PNG de la PWA sans dépendance externe.
   Usage : node tools/gen-icons.js                                        */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'icons');

/* ───── encodeur PNG minimal (RGBA, 8 bits) ───── */
function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;     // bit depth
  ihdr[9] = 6;     // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;   // filtre : none
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ───── dessin ───── */
const lerp = (a, b, t) => a + (b - a) * t;

function draw(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  // rayon du disque : plus petit en maskable pour rester dans la zone sûre
  const radius = maskable ? size * 0.40 : size * 0.5;
  const corner = size * 0.22;

  const set = (x, y, r, g, b, a) => {
    const o = (y * size + x) * 4;
    const na = a / 255;
    px[o]     = Math.round(lerp(px[o],     r, na));
    px[o + 1] = Math.round(lerp(px[o + 1], g, na));
    px[o + 2] = Math.round(lerp(px[o + 2], b, na));
    px[o + 3] = Math.min(255, px[o + 3] + a);
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside;
      if (maskable) {
        inside = 1;  // fond plein : la plateforme applique son propre masque
      } else {
        // carré à coins arrondis
        const dx = Math.max(Math.abs(x - cx) - (size / 2 - corner), 0);
        const dy = Math.max(Math.abs(y - cy) - (size / 2 - corner), 0);
        const d = Math.hypot(dx, dy);
        inside = d <= corner ? 1 : Math.max(0, 1 - (d - corner));
      }
      if (inside <= 0) continue;
      // dégradé diagonal bleu nuit → bleu ciel
      const t = (x / size * 0.55 + (1 - y / size) * 0.45);
      const r = Math.round(lerp(10, 42, t));
      const g = Math.round(lerp(26, 110, t));
      const b = Math.round(lerp(52, 200, t));
      set(x, y, r, g, b, Math.round(255 * inside));
    }
  }

  /* silhouette d'avion vue de dessus, blanche */
  const white = (x, y, a = 255) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    set(Math.round(x), Math.round(y), 255, 255, 255, a);
  };
  const S = radius * 0.92;                 // demi-longueur de l'appareil
  const fill = (test) => {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = (x - cx) / S, v = (y - cy) / S;
        if (test(u, v)) white(x, y);
      }
    }
  };
  fill((u, v) => {
    const au = Math.abs(u);
    // fuselage
    if (au < 0.085 && v > -0.92 && v < 0.86) return true;
    // nez arrondi
    if (Math.hypot(u / 0.085, (v + 0.86) / 0.16) < 1) return true;
    // aile principale : bord d'attaque en flèche, envergure maxi vers l'arrière
    if (v > -0.10 && v < 0.32 && au < 0.88 * ((v + 0.10) / 0.42)) return true;
    // empennage horizontal, même logique en réduit
    if (v > 0.56 && v < 0.82 && au < 0.36 * ((v - 0.56) / 0.26)) return true;
    return false;
  });

  return png(size, size, px);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'icon-192.png'), draw(192));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), draw(512));
fs.writeFileSync(path.join(OUT, 'icon-maskable-512.png'), draw(512, { maskable: true }));
console.log('Icônes générées dans', OUT);
