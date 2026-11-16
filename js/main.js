// ===============================================================
// Perfil: render de datos, capas decorativas aleatorias y efectos.
// Los datos se editan en js/config.js
// ===============================================================

// ---------- Utilidades ----------
const $ = id => document.getElementById(id);
const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (t, c, x) => {
  const e = document.createElement(t);
  if (c) e.className = c;
  if (x != null) e.textContent = x;
  return e;
};

// ---------- Referencias y estado ----------
const card = $('card');
const stage = $('stage');
const sT = $('sT');
const sB = $('sB');
const fxBox = $('fxbox');
const fxImg = $('fx');

let cur = null;          // set de capas activo
let last = -1;           // último set usado (para no repetirlo)
let hasRendered = false;
let rolling = false;

let fxTimer = null;
let fxStarted = false;
let fxGeneration = 0;
let lastFx = null;
let fxPreload = null;
let cardVisible = true;

// ---------- Perfil ----------
// Insignia: URL de imagen (png/webp/jpg) o texto/emoji.
const isBadgeImageUrl = value => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value.trim(), document.baseURI);
    return /^(?:https?|file):$/.test(url.protocol) && /\.(?:webp|png|jpe?g)$/i.test(url.pathname);
  } catch {
    return false;
  }
};

const renderBadge = value => {
  const badge = el('span');
  if (isBadgeImageUrl(value)) {
    const image = new Image();
    badge.className = 'badge-image';
    badge.setAttribute('role', 'img');
    badge.setAttribute('aria-label', 'Insignia');
    badge.title = 'Insignia';
    image.className = 'badge-image-icon';
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = value.trim();
    image.onerror = () => {
      badge.className = '';
      ['role', 'aria-label', 'title'].forEach(a => badge.removeAttribute(a));
      badge.textContent = 'Insignia';
    };
    badge.append(image);
  } else {
    badge.textContent = value;
  }
  $('badges').append(badge);
};

$('name').textContent = PROFILE.name;
$('handle').textContent = PROFILE.handle;
$('since').textContent = PROFILE.since;
$('bio').textContent = PROFILE.bio;
document.querySelector('.banner').style.background = PROFILE.bannerColor;

PROFILE.badges.forEach(renderBadge);

PROFILE.roles.forEach(([n, c]) => {
  const r = el('span');
  const i = el('i');
  i.style.background = c;
  r.append(i, n);
  $('roles').append(r);
});

PROFILE.links.forEach(([n, u, c, slug]) => {
  const a = el('a');
  a.href = u;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  const b = el('b');
  b.style.background = c;
  // Icono blanco desde el CDN de Simple Icons; si falla se muestra la inicial
  const ic = new Image();
  ic.alt = '';
  ic.loading = 'lazy';
  ic.src = 'https://cdn.simpleicons.org/' + slug + '/ffffff';
  ic.onerror = () => { ic.remove(); b.textContent = n.charAt(0); };
  b.append(ic);
  a.append(b, n, el('em', '', '↗'));
  $('links').append(a);
});

// ---------- Capas decorativas ----------
// Coloca una capa (imagen) arriba o abajo de la tarjeta; la oculta si no tiene fuente.
function put(e, c, top, scale, cardHeight) {
  if (!c || !c.s) {
    e.style.display = 'none';
    return;
  }
  e.style.display = '';
  e.style.width = c.w * scale + 'px';
  e.style.left = -c.l * scale + 'px';
  e.style.top = top ? -c.e * scale + 'px' : (cardHeight - c.e * scale) + 'px';
}

function layout() {
  if (!cur) return;
  const cardWidth = card.clientWidth;
  if (!cardWidth) return;
  const s = cardWidth / (cur.top.r - cur.top.l);
  card.style.setProperty('--w', cardWidth + 'px');

  stage.style.paddingTop = cur.top.e * s + 24 + 'px';
  stage.style.paddingBottom = (cur.bot.h - cur.bot.e) * s + 72 + 'px';
  // Se mide después de actualizar --w: esa variable define la altura mínima.
  const cardHeight = card.offsetHeight;

  put($('mt'), cur.midT, 1, s, cardHeight);
  put($('ft'), cur.top, 1, s, cardHeight);
  put($('fb'), cur.bot, 0, s, cardHeight);
  put($('bt'), cur.backT, 1, s, cardHeight);
  put($('bb'), cur.backB, 0, s, cardHeight);

  const side = cur.side;
  sT.style.display = sB.style.display = side ? '' : 'none';
  if (side) {
    const bh = (SIDEH - SPLIT) * s;
    for (const d of [sT, sB]) {
      d.style.width = side.w * s + 'px';
      d.style.left = -cur.top.l * s + 'px';
    }
    sT.style.top = -cur.top.e * s + 'px';
    sT.style.height = SPLIT * s + 'px';
    sB.style.height = bh + 'px';
    sB.style.top = cardHeight + (cur.bot.h - cur.bot.e) * s - bh + 'px';
  }
}

// Espera a que una imagen cargue (o falle)
const whenLoaded = (img, src) => new Promise(resolve => {
  let settled = false;
  const done = () => {
    if (settled) return;
    settled = true;
    img.onload = img.onerror = null;
    resolve();
  };
  img.decoding = 'async';
  img.onload = img.onerror = done;
  if (src) img.src = src;
  if (img.complete) done();
});

async function roll() {
  if (rolling) return;
  rolling = true;
  $('rr').disabled = true;

  const firstRoll = !hasRendered;
  const reduceMotion = prefersReducedMotion();
  if (!firstRoll) {
    stopFx();
    // Se oculta y congela todo mientras se cambian las imágenes
    stage.classList.add('is-leaving', 'is-swapping');
    await wait(reduceMotion ? 0 : 320);
  }

  let i;
  do {
    i = Math.floor(Math.random() * SETS.length);
  } while (i === last && SETS.length > 1);
  last = i;
  cur = SETS[i];

  // Las capas que el set no usa las oculta layout() mediante put()
  const layers = [
    [$('ft'), cur.top.s],
    [$('fb'), cur.bot.s],
    [$('deco'), pick(DECOS)]
  ];
  if (cur.midT) layers.push([$('mt'), cur.midT.s]);
  if (cur.backT) layers.push([$('bt'), cur.backT.s], [$('bb'), cur.backB.s]);

  const loads = layers
    .filter(([, src]) => src)
    .map(([img, src]) => whenLoaded(img, src));

  if (cur.side) {
    sT.style.backgroundImage = sB.style.backgroundImage = 'url(' + cur.side.s + ')';
    loads.push(whenLoaded(new Image(), cur.side.s));
  }

  const banner = $('bannerImg');
  banner.classList.remove('ready');
  loads.push(whenLoaded(banner, pick(BANNERS)).then(() => banner.classList.add('ready')));

  const avatar = document.querySelector('.av .a');
  loads.push(whenLoaded(avatar));

  // Máximo 8 s de espera por los recursos
  await Promise.race([Promise.all(loads), wait(8000)]);

  layout();

  if (firstRoll) {
    stage.classList.add('on');
    $('loader').classList.add('is-hidden');
  } else {
    // Un frame con el nuevo layout aún oculto, y luego se muestra
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    stage.classList.remove('is-leaving', 'is-swapping');
    stage.classList.add('is-entering');
    await wait(reduceMotion ? 0 : 560);
    stage.classList.remove('is-entering');
  }

  hasRendered = true;
  rolling = false;
  $('rr').disabled = false;

  if (!fxStarted) {
    fxStarted = true;
    scheduleFx(FX_CFG.firstDelay);
  } else {
    showFx();
  }
}

// ---------- Efectos (humo / partículas sobre la tarjeta) ----------
function stopFx() {
  fxGeneration++;
  clearTimeout(fxTimer);
  fxTimer = null;
  if (fxPreload) {
    fxPreload.onload = fxPreload.onerror = null;
    fxPreload.src = '';
    fxPreload = null;
  }
  fxBox.classList.remove('show');
  fxBox.classList.add('is-cancelled');
  lastFx = fxImg.getAttribute('src') || lastFx;
  // Se quita el src para que el PNG animado deje de decodificarse
  fxImg.removeAttribute('src');
}

function scheduleFx(delay) {
  clearTimeout(fxTimer);
  if (document.hidden || rolling || !cardVisible || prefersReducedMotion()) {
    fxTimer = null;
    return;
  }
  const generation = fxGeneration;
  fxTimer = setTimeout(() => {
    fxTimer = null;
    if (generation !== fxGeneration || rolling || document.hidden) return;
    showFx();
  }, delay != null ? delay : rand(FX_CFG.minGap, FX_CFG.maxGap));
}

function showFx() {
  if (document.hidden || rolling || !cardVisible || prefersReducedMotion()) {
    scheduleFx(FX_CFG.minGap);
    return;
  }
  const choices = FX.filter(source => source !== lastFx);
  const next = pick(choices.length ? choices : FX);
  lastFx = next;
  const generation = fxGeneration;
  const preload = new Image();
  preload.decoding = 'async';
  preload.fetchPriority = 'low';
  fxPreload = preload;
  let loaded = false;

  const go = () => {
    if (loaded) return;
    loaded = true;
    fxPreload = null;
    if (generation !== fxGeneration || rolling || document.hidden) return;
    fxImg.src = next;
    fxBox.classList.remove('is-cancelled');
    fxBox.classList.add('show');
    clearTimeout(fxTimer);
    fxTimer = setTimeout(() => {
      fxTimer = null;
      if (generation !== fxGeneration) return;
      fxBox.classList.remove('show');
      // Se mantiene el fade de CSS (1.6 s) y luego se liberan los frames
      fxTimer = setTimeout(() => {
        fxTimer = null;
        if (generation !== fxGeneration) return;
        fxImg.removeAttribute('src');
        scheduleFx();
      }, 1600);
    }, FX_CFG.visibleFor);
  };
  const failed = () => {
    if (loaded) return;
    loaded = true;
    fxPreload = null;
    if (generation !== fxGeneration || rolling) return;
    fxBox.classList.remove('show');
    fxBox.classList.add('is-cancelled');
    scheduleFx();
  };

  preload.onload = go;
  preload.onerror = failed;
  preload.src = next;
  if (preload.complete) {
    if (preload.naturalWidth > 0) go();
    else failed();
  }
}

// ---------- Observadores y arranque ----------
let layoutFrame = 0;
function scheduleLayout() {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    layout();
  });
}

// ResizeObserver evita recalcular en cada evento de resize.
// Se observa la tarjeta completa (no solo el ancho) porque las capas de abajo
// dependen también de su altura.
if (window.ResizeObserver) {
  new ResizeObserver(scheduleLayout).observe(card);
} else {
  addEventListener('resize', scheduleLayout, { passive: true });
}

if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    cardVisible = entry.isIntersecting;
    if (!cardVisible) stopFx();
    else if (fxStarted && !rolling) scheduleFx(FX_CFG.minGap);
  }).observe(card);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopFx();
  else if (fxStarted && !rolling) scheduleFx(FX_CFG.minGap);
});

$('rr').onclick = roll;
roll();
