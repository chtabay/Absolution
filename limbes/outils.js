// Limbes : les outils partagés. Des nombres tirés d’une graine, stables, et le mélange des couleurs.

export const rng = seed => { let s = Math.abs(Math.floor(seed)) % 2147483647 || 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };
export const hash = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; }; // un nombre stable entre 0 et 1

export const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const versHex = c => `#${c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const melange = (a, b, t) => { const A = hex(a), B = hex(b); return versHex(A.map((v, i) => v + (B[i] - v) * t)); };
export const nuance = (h, k) => versHex(hex(h).map(v => (k >= 0 ? v + (255 - v) * k : v * (1 + k)))); // k > 0 éclaircit, k < 0 assombrit
