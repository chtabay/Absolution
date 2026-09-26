// Limbes — maquette D : les outils de dessin, en Canvas 2D. Rien ne vient d’ailleurs.

export const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const speedK = reduced ? 0 : 1;

export const rng = seed => { let s = Math.abs(Math.floor(seed)) % 2147483647 || 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
export const hash = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; }; // un nombre stable entre 0 et 1
export const clamp01 = v => Math.max(0, Math.min(1, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const choix = (liste, v) => liste[Math.floor(clamp01(v) * liste.length) % liste.length];

export const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const versHex = c => `#${c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const melange = (a, b, t) => { const A = hex(a), B = hex(b); return versHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const nuance = (h, k) => versHex(hex(h).map(v => (k >= 0 ? v + (255 - v) * k : v * (1 + k)))); // k > 0 éclaircit, k < 0 assombrit
export const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };

// Une facette. Opaque, elle est aussi tracée de sa couleur, pour qu’on ne voie pas les coutures.
export const P = (x, pts, fill) => {
  x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fillStyle = fill; x.fill();
  if (typeof fill === 'string' && fill[0] === '#') { x.strokeStyle = fill; x.lineWidth = .7; x.lineJoin = 'round'; x.stroke(); }
};
export const L = (x, pts, stroke, w, dash) => { x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.strokeStyle = stroke; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.stroke(); x.setLineDash([]); };
export const E = (x, X, Y, rx, ry, fill) => { x.beginPath(); x.ellipse(X, Y, Math.max(.01, rx), Math.max(.01, ry), 0, 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
export const C = (x, X, Y, r, fill) => { x.beginPath(); x.arc(X, Y, Math.max(.01, r), 0, Math.PI * 2); x.fillStyle = fill; x.fill(); };
export const halo = (x, X, Y, r, col, a) => { const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, Math.PI * 2); x.fill(); };
export const ombre = (x, X, Y, rx, ry, a = .12) => E(x, X + rx * .12, Y + ry * .2, rx, ry, `rgba(40,30,20,${a})`);
export const pop = (t, T) => { if (t == null || reduced) return 1; const p = clamp01((T - t) / .7) - 1; return 1 + 2.7 * p * p * p + 1.7 * p * p; }; // apparaît avec un petit rebond
