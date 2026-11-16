// ====== TUS DATOS (edita aquí) ======
const PROFILE = {
  name: 'Ghozd',
  handle: 'Ghozd',
  badges: [
    'assets/badges/01.png',
    'assets/badges/02.png',
    'assets/badges/03.png',
  ],
  since: '6 junio 6666',
  bannerColor: '#9a9a9a',
  bio: 'La vida es como una tula: parece corta, pero se vuelve larga cuando se pone dura.',
  roles: [
    ['Editor', '#8e8e93'],
    ['Lector', '#c0392b'],
    ['Normi', '#e8d9b0']
  ],
  // [nombre, enlace, color de fondo, icono de Simple Icons]
  // Lista de iconos gratis: https://simpleicons.org  (usa el "slug", ej: instagram, github, x...)
  links: [
    ['Instagram', 'https://www.instagram.com/gh0zd', '#e1306c', 'instagram'],
    ['GitHub', 'https://github.com/Gh0zd', '#555', 'github'],
    ['YouTube', 'https://www.youtube.com/@Ghozd', '#ff0033', 'youtube'],
  ]
};

// ====== ASSETS ======
const A = {
  eyesT: 'assets/sets/eyes/eyes-top.png',
  eyesB: 'assets/sets/eyes/eyes-bottom.png',
  eyesBgT: 'assets/sets/eyes/eyes-bg-top.png',
  eyesBgB: 'assets/sets/eyes/eyes-bg-bottom.png',
  woman: 'assets/sets/monster/monster-top-back.png',
  centi: 'assets/sets/monster/monster-bottom.png',
  sideEyes: 'assets/sets/eyes/eyes-sides.png',
  sideLegs: 'assets/sets/monster/monster-sides.png',
  decoEye: 'assets/decorations/deco-eye.png',
  decoBones: 'assets/decorations/deco-bones.png',
  decoTeeth: 'assets/decorations/deco-teeth.png',
  dragon: 'assets/decorations/dragon.png',
  luna: 'assets/decorations/luna.png',

  fx1: 'assets/effects/effect-1.png',
  fx2: 'assets/effects/effect-2.png',
  fx3: 'assets/effects/effect-3.png',
  ban1: 'assets/banners/banner-1.webp',
  ban2: 'assets/banners/banner-2.webp'
};

// ====== EFECTOS (humo/partículas sobre la tarjeta) ======
// Salen 1 vez al abrir la página y luego solo de vez en cuando.
const FX_CFG = {
  firstDelay: 1200,    // ms después de abrir la página para el primer efecto
  visibleFor: 8000,    // ms que se queda visible cada vez
  minGap: 20000,       // espera mínima antes de volver a salir (20 s)
  maxGap: 30000        // espera máxima (30 s)
};

// Medidas (px) de los PNG laterales: alto total y punto donde se corta en parte superior/inferior.
const SIDEH = 2528;
const SPLIT = 1070;

const SETS = [
  {
    top:   { s: A.eyesT,   w: 1305, l: 70, r: 1240, e: 312 },
    bot:   { s: A.eyesB,   w: 1305, h: 414, l: 70, r: 1240, e: 195 },
    backT: { s: A.eyesBgT, w: 1308, l: 72, r: 1242, e: 328 },
    backB: { s: A.eyesBgB, w: 1308, h: 423, l: 72, r: 1242, e: 190 },
    side:  { s: A.sideEyes, w: 1312 }
  },
  {
    top:  { s: null,     w: 1311, l: 62, r: 1251, e: 318 },
    midT: { s: A.woman,  w: 1311, l: 62, r: 1251, e: 318 },
    bot:  { s: A.centi,  w: 1312, h: 424, l: 62, r: 1251, e: 200 },
    side: { s: A.sideLegs, w: 1312 }
  }
];

const DECOS = [A.decoEye, A.decoBones, A.decoTeeth, A.dragon, A.luna];
const FX = [A.fx1, A.fx2, A.fx3];
const BANNERS = [A.ban1, A.ban2];
