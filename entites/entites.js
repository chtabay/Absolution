// Limbes — planche : quatre incarnations de ce qu’on dépose, et le geste de l’envoyer au monde.
// L’entité ne lit jamais un texte : elle suit les réglages (les cases, dans l’appli).
// Le monde est une moyenne inventée pour la planche.

const $ = s => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = $('#c'), ctx = canvas.getContext('2d');

const params = { a: .5, v: .35, w: .5, m: false, r: false, p: false, t: false }; // agité, supportable, poids, moral, relationnel, projet, texte
const world = { a: .45, v: .4, w: .55, n: 1214 };
const speedK = reduced ? .25 : 1;
let kind = 'forme', W = 0, H = 0, sending = null, sent = false, flare = 0, pulse = 0;
const t0 = performance.now();

const LEGEND = {
  forme: 'Rythme : agité. Couleur : douloureux ou supportable. Taille : le poids. Angles : moral. Attache : relationnel. Étirement : projet. Lueur : un texte. Le monde est la grande, avec ses grains.',
  braise: 'Étincelles : agité. Couleur : douloureux ou supportable. Cœur : le poids. Trajectoires cassées : moral. Deux braises : relationnel. Hauteur : projet. Le monde est le feu.',
  ciel: 'Place : agité en haut, supportable à droite. Scintillement : agité. Taille : le poids. Rayons : moral. Étoile double : relationnel. Traînée : projet. Le monde est le ciel.',
  cairn: 'Tremblement : agité. Couleur : douloureux ou supportable. Taille : le poids. Arêtes : moral. Deux pierres : relationnel. Debout : projet. Le monde est le tas.',
};

/* ───────── Outils ───────── */

const lerp = (a, b, x) => a + (b - a) * x;
const clamp01 = x => Math.max(0, Math.min(1, x));
const ease = x => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
const mix = (c1, c2, x) => c1.map((c, i) => Math.round(lerp(c, c2[i], x)));
const rgba = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rng = seed => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

// Palettes : [douloureux, supportable]
const PAL = {
  forme: [[92, 104, 196], [214, 150, 74]],
  braise: [[168, 52, 96], [246, 178, 72]],
  ciel: [[150, 165, 255], [255, 214, 140]],
  cairn: [[112, 122, 140], [176, 138, 92]],
};
function tone(k, q) { // valence → teinte ; éteint → plus sombre (sauf le ciel, qui joue sur l’alpha)
  const c = mix(PAL[k][0], PAL[k][1], clamp01(q.v));
  const bright = k === 'ciel' ? 1 : lerp(.74, 1.05, clamp01(q.a));
  return c.map(x => Math.min(255, Math.round(x * bright)));
}

/* ───────── La forme ───────── */

function drawBlob(cx, cy, R, q, T, o = {}) {
  const speed = (.4 + 1.8 * q.a) * speedK, amp = .04 + .16 * q.a, alpha = o.alpha ?? 1, col = tone('forme', q);
  ctx.beginPath();
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const th = i / N * Math.PI * 2;
    let r = R * (1 + amp * Math.sin(3 * th + T * speed) + amp * .6 * Math.sin(5 * th - T * speed * 1.3 + 1));
    if (q.m) r += R * .13 * Math.abs(Math.sin(7 * th + T * speed * 1.7));
    if (q.p) r *= 1 + .28 * Math.max(0, -Math.sin(th));
    const X = cx + r * Math.cos(th), Y = cy + r * Math.sin(th);
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(col, alpha);
  ctx.fill();
  if (q.r) { // une attache : un petit lobe relié
    const ang = Math.PI * .8 + Math.sin(T * speed * .5) * .2, lx = cx + Math.cos(ang) * R * 1.25, ly = cy + Math.sin(ang) * R * 1.25;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lx, ly);
    ctx.lineWidth = Math.max(2, R * .18); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(col, alpha * .9); ctx.stroke();
    ctx.beginPath(); ctx.arc(lx, ly, R * .38, 0, Math.PI * 2); ctx.fillStyle = rgba(col, alpha); ctx.fill();
  }
  if (q.t) { // une lueur intérieure
    const g = ctx.createRadialGradient(cx - R * .2, cy - R * .2, 0, cx, cy, R);
    g.addColorStop(0, `rgba(255,255,255,${.55 * alpha})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  }
  if (o.grain) { // les autres, dans la masse
    const r = rng(11);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < o.grain; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * .85;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function forme(T, prog) {
  ctx.fillStyle = '#f6f2ea'; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cyW = H * .4, R0 = Math.min(W, H) * (.2 + .1 * world.w) * (1 + pulse * .08);
  drawBlob(cx, cyW, R0, { a: world.a, v: world.v, m: false, r: false, p: false, t: false }, T * .5, { alpha: .92, grain: 70 });
  if (!sent) {
    const s = prog == null ? 0 : ease(prog);
    drawBlob(cx, lerp(H * .8, cyW, s), (16 + 36 * params.w) * (1 - .85 * s), params, T, { alpha: 1 - .3 * s });
  }
  pulse *= .96;
}

/* ───────── La braise ───────── */

let sparks = [];
function spawn(x, y, q, spread) {
  sparks.push({ x: x + (Math.random() - .5) * spread, y, vx: (Math.random() - .5) * (q.m ? 1.6 : .6), vy: -(.6 + Math.random() * 1.2) * (q.p ? 1.6 : 1), life: 1, decay: .012 + Math.random() * .02, size: 1 + Math.random() * 2, col: tone('braise', q), jag: q.m });
}

function braise(T, prog) {
  ctx.fillStyle = '#1a1512'; ctx.fillRect(0, 0, W, H);
  const fx = W / 2, fy = H * .84, fw = W * .55 * (.8 + .4 * world.w), wc = tone('braise', world);
  const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fw * (.8 + flare * .4));
  g.addColorStop(0, rgba(wc, .95)); g.addColorStop(.5, rgba(wc, .35)); g.addColorStop(1, rgba(wc, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(fx, fy, fw, fw * .45, 0, 0, Math.PI * 2); ctx.fill();
  for (let layer = 0; layer < 2; layer++) { // des langues qui vacillent, larges et douces
    for (let i = 0; i < 7; i++) {
      const ox = (i - 3) * fw * .22 * (layer ? .7 : 1), sway = Math.sin(T * (1.6 + layer) * speedK + i * 1.7) * fw * .06;
      const h = fw * (.16 + .2 * world.a) * (layer ? .6 : 1) * (1 + .25 * Math.sin(T * (1.3 + i * .4) * speedK + i)) * (1 + flare);
      const hw = fw * (layer ? .1 : .16);
      ctx.beginPath(); ctx.moveTo(fx + ox - hw, fy + 4);
      ctx.bezierCurveTo(fx + ox - hw * .9, fy - h * .45, fx + ox + sway - hw * .3, fy - h * .8, fx + ox + sway, fy - h);
      ctx.bezierCurveTo(fx + ox + sway + hw * .3, fy - h * .8, fx + ox + hw * .9, fy - h * .45, fx + ox + hw, fy + 4);
      ctx.fillStyle = rgba(layer ? mix(wc, [255, 230, 180], .5) : wc, layer ? .28 : .3); ctx.fill();
    }
  }
  if (Math.random() < (.3 + world.a * .5) * speedK) spawn(fx, fy - 10, { a: world.a, v: world.v, m: false, p: false }, fw * .6);
  if (!sent) {
    const s = prog == null ? 0 : ease(prog), bx = W / 2, by = lerp(H * .32, fy - 6, s), br = (8 + 18 * params.w) * (1 - .6 * s), c = tone('braise', params);
    const gg = ctx.createRadialGradient(bx, by, 0, bx, by, br * 3);
    gg.addColorStop(0, rgba(c, 1)); gg.addColorStop(.35, rgba(c, .5)); gg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(bx, by, br * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(mix(c, [255, 240, 220], .5)); ctx.beginPath(); ctx.arc(bx, by, br * (1 + .08 * Math.sin(T * (2 + 6 * params.a) * speedK)), 0, Math.PI * 2); ctx.fill();
    if (params.r) { ctx.fillStyle = rgba(c, .9); ctx.beginPath(); ctx.arc(bx + br * 2.2, by + br * .8, br * .55, 0, Math.PI * 2); ctx.fill(); }
    if (params.t) { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, br * 1.6, 0, Math.PI * 2); ctx.stroke(); }
    if (Math.random() < (.15 + params.a * .7) * speedK) spawn(bx, by, params, br * 1.2);
  }
  sparks = sparks.filter(sp => sp.life > 0);
  if (sparks.length > 220) sparks.splice(0, sparks.length - 220);
  for (const sp of sparks) {
    sp.x += sp.vx + (sp.jag ? (Math.random() - .5) * 1.5 : Math.sin(T * 3 + sp.y * .05) * .2);
    sp.y += sp.vy * speedK;
    sp.life -= sp.decay * speedK;
    ctx.fillStyle = rgba(sp.col, Math.max(0, sp.life)); ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
  }
  flare *= .95;
}

/* ───────── Le ciel ───────── */

let stars = [];
function seedStars() {
  const r = rng(3);
  stars = [];
  for (const [q, share] of Object.entries({ AD: 27, ED: 41, AS: 14, ES: 18 })) {
    for (let i = 0; i < Math.round(share * 1.6); i++) {
      const a = (q[0] === 'A' ? .5 : 0) + r() * .5, v = (q[1] === 'S' ? .5 : 0) + r() * .5;
      stars.push({ a, v, size: .8 + r() * 1.6, ph: r() * Math.PI * 2, sp: .5 + r() * 1.5, col: tone('ciel', { a, v }) });
    }
  }
}
const starPos = (a, v) => [W * (.08 + .84 * v), H * (.08 + .84 * (1 - a))];

function drawStar(x, y, size, col, alpha, q, T) {
  ctx.fillStyle = rgba(col, alpha);
  ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
  if (q?.m) {
    ctx.strokeStyle = rgba(col, alpha * .8); ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const an = i * Math.PI / 4 + T * .3; ctx.beginPath(); ctx.moveTo(x - Math.cos(an) * size * 3, y - Math.sin(an) * size * 3); ctx.lineTo(x + Math.cos(an) * size * 3, y + Math.sin(an) * size * 3); ctx.stroke(); }
  }
  if (q?.r) { ctx.beginPath(); ctx.arc(x + size * 2.4, y + size * 1.2, size * .55, 0, Math.PI * 2); ctx.fill(); }
  if (q?.p) {
    const g = ctx.createLinearGradient(x, y, x - size * 8, y + size * 8);
    g.addColorStop(0, rgba(col, alpha * .7)); g.addColorStop(1, rgba(col, 0));
    ctx.strokeStyle = g; ctx.lineWidth = size * .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - size * 8, y + size * 8); ctx.stroke();
  }
}

function ciel(T, prog) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b0f2a'); bg.addColorStop(1, '#161a3a');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; // des repères, à peine
  ctx.beginPath(); ctx.moveTo(W / 2, H * .06); ctx.lineTo(W / 2, H * .94); ctx.moveTo(W * .06, H / 2); ctx.lineTo(W * .94, H / 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.font = '700 9px Nunito, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('AGITÉ', W / 2, H * .05 + 3); ctx.fillText('ÉTEINT', W / 2, H * .97);
  ctx.save(); ctx.translate(W * .04, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('DOULOUREUX', 0, 3); ctx.restore();
  ctx.save(); ctx.translate(W * .96, H / 2); ctx.rotate(Math.PI / 2); ctx.fillText('SUPPORTABLE', 0, 3); ctx.restore();
  for (const s of stars) { const [x, y] = starPos(s.a, s.v); drawStar(x, y, s.size, s.col, .5 + .3 * Math.sin(T * s.sp * speedK + s.ph), null, T); }
  if (!sent) {
    const [x, y] = starPos(params.a, params.v), s = prog == null ? 0 : ease(prog);
    const size = (3 + 6 * params.w) * (1 - .6 * s), tw = .75 + .25 * Math.sin(T * (1 + 6 * params.a) * speedK), col = tone('ciel', params);
    if (s > 0) { ctx.strokeStyle = rgba(col, (1 - s) * .6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, size + s * 60, 0, Math.PI * 2); ctx.stroke(); }
    const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
    halo.addColorStop(0, rgba(col, .5 * tw)); halo.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, size * 4, 0, Math.PI * 2); ctx.fill();
    drawStar(x, y, size, mix(col, [255, 255, 255], .4), tw, params, T);
    if (params.t) { ctx.strokeStyle = rgba(col, .5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, size * 2.2, 0, Math.PI * 2); ctx.stroke(); }
  }
}

/* ───────── Le cairn ───────── */

let pile = [];
function seedPile() {
  const r = rng(5);
  pile = [];
  const baseY = H * .9, cx = W / 2;
  for (let i = 0; i < 48; i++) { // un tas : plus on monte, plus c’est étroit
    const row = Math.floor(i / 8), col = i % 8, width = W * .34 * (1 - row * .13);
    pile.push({ x: cx + (col - 3.5) / 3.5 * width + (r() - .5) * 8, y: baseY - row * (14 + 10 * world.w) - r() * 4, s: 9 + r() * 9 + 6 * world.w, rot: (r() - .5) * .6, v: clamp01(world.v + (r() - .5) * .4), sides: 5 + Math.floor(r() * 3) });
  }
}

function drawStone(x, y, s, q, rot, T, sides = 6, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + (o.wobble ? Math.sin(T * (4 + 12 * q.a) * speedK) * .06 * q.a : 0));
  const n = q.m ? 4 : sides, ky = q.p ? 1.7 : .8;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const an = i / n * Math.PI * 2 - Math.PI / 2, rr = s * (q.m ? (i % 2 ? .85 : 1.05) : 1 + .08 * Math.sin(i * 2.1));
    const X = Math.cos(an) * rr, Y = Math.sin(an) * rr * ky;
    if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(tone('cairn', q), o.alpha ?? 1); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
  if (q.t) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-s * .25, -s * .3 * ky, s * .3, s * .18, -.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  if (q.r && o.pair) drawStone(x + s * 1.5, y + s * .3, s * .7, { ...q, r: false }, rot - .5, T, sides, { ...o, pair: false });
}

function cairn(T, prog) {
  ctx.fillStyle = '#f6f2ea'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.05)'; ctx.beginPath(); ctx.ellipse(W / 2, H * .91, W * .4, 10, 0, 0, Math.PI * 2); ctx.fill();
  for (const st of pile) drawStone(st.x, st.y, st.s, { a: .2, v: st.v, m: false, r: false, p: false, t: false }, st.rot, T, st.sides);
  if (!sent) {
    const topY = Math.min(...pile.map(p => p.y)) - 14, s = prog == null ? 0 : ease(prog);
    drawStone(W / 2, lerp(H * .22, topY, s), 14 + 24 * params.w, params, Math.sin(T * .5) * .05 * (1 - s), T, 6, { wobble: prog == null, pair: true });
  }
}

/* ───────── Boucle, envoi, réglages ───────── */

const RENDER = { forme, braise, ciel, cairn };

function resize() {
  const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
  W = Math.round(rect.width); H = Math.round(rect.height);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedStars(); seedPile();
}

function frame(now) {
  if (!document.hidden) {
    const T = (now - t0) / 1000;
    let prog = null;
    if (sending) { prog = Math.min(1, (now - sending.start) / sending.dur); if (prog >= 1) { finishSend(); prog = null; } }
    RENDER[kind](T, prog);
  }
  requestAnimationFrame(frame);
}

const worldLine = () => `Le monde${'\u202f'}: ${world.n.toLocaleString('fr-FR')} dépôts ce mois-ci. Sa couleur et son rythme suivent la moyenne. Chiffres inventés pour la planche.`;

function finishSend() {
  sending = null; sent = true;
  world.a = lerp(world.a, params.a, .06); world.v = lerp(world.v, params.v, .06); world.w = lerp(world.w, params.w, .06); world.n += 1;
  if (kind === 'ciel') stars.push({ a: params.a, v: params.v, size: 1 + 1.4 * params.w, ph: 0, sp: 1, col: tone('ciel', params) });
  if (kind === 'cairn') pile.push({ x: W / 2, y: Math.min(...pile.map(p => p.y)) - 14, s: Math.min(14 + 24 * params.w, 20), rot: 0, v: params.v, sides: params.m ? 4 : 6 });
  if (kind === 'braise') flare = 1;
  if (kind === 'forme') pulse = 1;
  $('#send').hidden = true; $('#again').hidden = false;
  $('#worldline').textContent = worldLine();
}

function reset() { sending = null; sent = false; $('#send').hidden = false; $('#again').hidden = true; }

function setKind(k) {
  kind = k;
  reset();
  document.querySelectorAll('[role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.k === k)));
  $('#legend').textContent = LEGEND[k];
}

document.querySelectorAll('[role="tab"]').forEach(b => b.addEventListener('click', () => setKind(b.dataset.k)));
for (const id of ['a', 'v', 'w']) $(`#${id}`).addEventListener('input', e => { params[id] = +e.target.value; });
document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
  params[b.dataset.p] = !params[b.dataset.p];
  b.classList.toggle('on', params[b.dataset.p]);
  b.setAttribute('aria-pressed', String(params[b.dataset.p]));
}));
$('#send').addEventListener('click', () => { if (!sending && !sent) sending = { start: performance.now(), dur: reduced ? 400 : 1500 }; });
$('#again').addEventListener('click', reset);

addEventListener('resize', resize);
resize();
setKind('forme');
$('#worldline').textContent = worldLine();
requestAnimationFrame(frame);
