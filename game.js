const GAME_W = 800;
const GAME_H = 600;

const PADDLE = { w: 120, h: 14, y: GAME_H - 40, speed: 600 }; // px/s
const BALL = { size: 16, r: 8, speed: 450 };                 // px/s
const BRICK = { w: 32, h: 16, gap: 8 };
const GRID = { top: 48, left: 32 };
const LIVES_START = 3;
const POINTS_PER_BRICK = 10;
const RECORD_KEY = 'arkanoid:v1';
const LAUNCH_ANGLE_MAX = 30 * Math.PI / 180;
const BOUNCE_ANGLE_MAX = 60 * Math.PI / 180;
const BOUNCE_MIN_VY = 100;

const PARTICLE = {
  count: 10,     // partículas por bloque roto
  life: 400,     // ms de vida de cada partícula
  speedMin: 60,  // px/s, velocidad mínima de salida
  speedMax: 180, // px/s, velocidad máxima de salida
  gravity: 400,  // px/s²
  size: 3,       // px de lado del cuadrado dibujado
};

const BLOCK_COLORS = {
  magenta: '#ff00ff',
  hotpink: '#ff69b4',
  red:     '#ff0000',
  green:   '#00cc44',
  yellow:  '#ffe000',
  cyan:    '#00e5ff',
  gray:    '#9aa0a6',
};

const SOUNDS = {
  bounce: { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5 },
  break:  { src: 'assets/sounds/break-sound.mp3', volume: 0.7 },
};
const SOUND_POOL = 4; // instancias simultáneas por sonido

const soundPools = {};
const soundIndex = {};

Object.keys( SOUNDS ).forEach( name => {
  soundPools[ name ] = [];
  soundIndex[ name ] = 0;
  for ( let i = 0; i < SOUND_POOL; i++ ) {
    const audio = new Audio( SOUNDS[ name ].src );
    audio.preload = 'auto';
    audio.volume = SOUNDS[ name ].volume;
    soundPools[ name ].push( audio );
  }
} );

function playSound( name ) {
  if ( state.muted ) return;
  const pool = soundPools[ name ];
  if ( !pool ) return;
  const audio = pool[ soundIndex[ name ] ];
  soundIndex[ name ] = ( soundIndex[ name ] + 1 ) % pool.length;
  audio.currentTime = 0;
  audio.play().catch( () => {} );
}

const REJILLA = [
  { offset: 0, count: 3 }, { offset: 4, count: 3 },
  { offset: 8, count: 3 }, { offset: 12, count: 3 },
  { offset: 16, count: 3 },
];
const MURO = [
  { offset: 0, count: 4 }, { offset: 5, count: 9 }, { offset: 15, count: 4 },
];

const LEVELS = [
  [ // Nivel 1 — 5 filas (SPEC 04), las 5 primeras del tablero de la SPEC 01.
    { color: 'magenta', segs: [ { offset: 4, count: 11 } ] },
    { color: 'hotpink', segs: [ { offset: 3, count: 13 } ] },
    { color: 'red',     segs: [ { offset: 3, count: 13 } ] },
    { color: 'green',   segs: [ { offset: 2, count: 15 } ] },
    { color: 'yellow',  segs: [ { offset: 2, count: 15 } ] },
  ],
  [ // Nivel 2 — 5 filas, pasillo central de 3 columnas (8, 9, 10).
    { color: 'magenta', segs: [ { offset: 5, count: 3 }, { offset: 11, count: 3 } ] },
    { color: 'hotpink', segs: [ { offset: 4, count: 4 }, { offset: 11, count: 4 } ] },
    { color: 'red',     segs: [ { offset: 3, count: 5 }, { offset: 11, count: 5 } ] },
    { color: 'green',   segs: [ { offset: 2, count: 6 }, { offset: 11, count: 6 } ] },
    { color: 'yellow',  segs: [ { offset: 1, count: 7 }, { offset: 11, count: 7 } ] },
  ],
  [ // Nivel 3 — 5 filas, pasillos de 2 columnas (4-5 y 13-14).
    { color: 'magenta', segs: [ { offset: 7, count: 5 } ] },
    { color: 'hotpink', segs: [ { offset: 6, count: 7 } ] },
    { color: 'red',     segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'green',   segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'yellow',  segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
  ],
  [ // Nivel 4 — 5 filas, rejilla: huecos verticales en 3, 7, 11 y 15.
    { color: 'magenta', segs: [ { offset: 4, count: 11 } ] },
    { color: 'hotpink', segs: [ { offset: 3, count: 13 } ] },
    { color: 'red',     segs: REJILLA },
    { color: 'green',   segs: REJILLA },
    { color: 'yellow',  segs: REJILLA },
  ],
  [ // Nivel 5 — 5 filas, muro denso con pasillos de 1 columna (4 y 14).
    { color: 'magenta', segs: [ { offset: 5, count: 9 } ] },
    { color: 'hotpink', segs: MURO },
    { color: 'red',     segs: MURO },
    { color: 'green',   segs: MURO },
    { color: 'yellow',  segs: MURO },
  ],
];

const state = {
  phase: 'menu',
  level: 1,
  muted: false,
  score: 0,
  lives: LIVES_START,
  record: 0,
  paddle: { x: GAME_W / 2, y: PADDLE.y, w: PADDLE.w, h: PADDLE.h },
  ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL.r, attached: true },
  bricks: [],
  explosions: [],
  particles: [],
};

function buildLevel( n ) {
  state.bricks = [];
  LEVELS[ n - 1 ].forEach( ( row, i ) => {
    row.segs.forEach( seg => {
      for ( let c = 0; c < seg.count; c++ ) {
        state.bricks.push( {
          x: GRID.left + ( seg.offset + c ) * ( BRICK.w + BRICK.gap ),
          y: GRID.top + i * ( BRICK.h + BRICK.gap ),
          w: BRICK.w,
          h: BRICK.h,
          color: row.color,
          alive: true,
        } );
      }
    } );
  } );
}

function attachBall() {
  state.ball.x = state.paddle.x;
  state.ball.y = state.paddle.y - state.ball.r;
}

function restart() {
  state.phase = 'menu';
  state.level = 1;
  state.score = 0;
  state.lives = LIVES_START;
  state.ball.attached = true;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.explosions = [];
  state.particles = [];
  buildLevel( state.level );
  attachBall();
  updateHud();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem( RECORD_KEY );
    if ( raw === null ) return;
    const data = JSON.parse( raw );
    if ( typeof data.score === 'number' ) state.record = data.score;
    if ( typeof data.muted === 'boolean' ) state.muted = data.muted;
  } catch ( e ) {}
}

function save() {
  try {
    localStorage.setItem( RECORD_KEY, JSON.stringify( { score: state.record, muted: state.muted } ) );
  } catch ( e ) {}
}

function updateRecord() {
  if ( state.score > state.record ) {
    state.record = state.score;
    save();
    updateHud();
  }
}

function drawExplosions() {
  const now = performance.now();

  for ( let i = state.explosions.length - 1; i >= 0; i-- ) {
    const ex = state.explosions[ i ];
    const elapsed = now - ex.start;
    if ( elapsed >= EXPLOSION_DURATION ) {
      state.explosions.splice( i, 1 );
      continue;
    }
    const frames = EXPLOSION_FRAMES[ ex.color ];
    const frameMs = EXPLOSION_DURATION / frames.length;
    const index = Math.min( frames.length - 1, Math.floor( elapsed / frameMs ) );
    drawFrame( ctx, frames[ index ], ex.x, ex.y, BRICK.w, BRICK.h );
  }
}

function drawParticles() {
  const size = PARTICLE.size;

  state.particles.forEach( p => {
    ctx.fillStyle = BLOCK_COLORS[ p.color ] || '#ffffff';
    ctx.fillRect( p.x - size / 2, p.y - size / 2, size, size );
  } );
}

function drawBricks() {
  state.bricks.forEach( b => {
    if ( !b.alive ) return;
    drawSprite( ctx, 'block_' + b.color, b.x, b.y, b.w, b.h );
  } );
}

function drawPaddle() {
  const p = state.paddle;
  drawSprite( ctx, 'paddle', p.x - p.w / 2, p.y, p.w, p.h );
}

function drawBall() {
  const b = state.ball;
  drawSprite( ctx, 'ball', b.x - b.r, b.y - b.r, BALL.size, BALL.size );
}

function drawMessage( lines ) {
  const lineHeight = 34;
  const padX = 32;
  const padY = 24;
  const boxW = 480;
  const boxH = lines.length * lineHeight + padY * 2;
  const boxX = ( GAME_W - boxW ) / 2;
  const boxY = ( GAME_H - boxH ) / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( boxX, boxY, boxW, boxH );

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach( ( line, i ) => {
    ctx.fillStyle = line.color || '#ffffff';
    ctx.font = line.font || 'bold 24px monospace';
    ctx.fillText( line.text, GAME_W / 2, boxY + padY + lineHeight * ( i + 0.5 ) );
  } );
}

function drawPhase() {
  if ( state.phase === 'menu' ) {
    drawMessage( [
      { text: 'ARKANOID', font: 'bold 40px monospace' },
      { text: 'Espacio o click para lanzar', font: '20px monospace' },
      { text: 'Flechas o ratón para mover la pala', font: '20px monospace' },
      { text: 'M para silenciar', font: '20px monospace' },
    ] );
  } else if ( state.phase === 'levelClear' ) {
    drawMessage( [
      { text: '¡Nivel ' + state.level + ' superado!', font: 'bold 30px monospace' },
      { text: 'Pulsa Enter para continuar', font: '20px monospace' },
    ] );
  } else if ( state.phase === 'victory' ) {
    drawMessage( [
      { text: '¡Victoria!', font: 'bold 36px monospace', color: '#ffe000' },
      { text: 'Puntuación: ' + state.score, font: '20px monospace' },
      { text: 'Pulsa Enter para reiniciar', font: '20px monospace' },
    ] );
  } else if ( state.phase === 'paused' ) {
    drawMessage( [
      { text: 'Pausa', font: 'bold 36px monospace', color: '#ffe000' },
      { text: 'Espacio o P para continuar', font: '20px monospace' },
    ] );
  } else if ( state.phase === 'gameOver' ) {
    drawMessage( [
      { text: 'Fin de partida', font: 'bold 36px monospace', color: '#ff0000' },
      { text: 'Puntuación: ' + state.score, font: '20px monospace' },
      { text: 'Pulsa Enter para reiniciar', font: '20px monospace' },
    ] );
  }
}

function drawMuted() {
  if ( !state.muted ) return;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText( 'Sin sonido', GAME_W - 12, 12 );
}

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const hud = {
  score: document.getElementById( 'score' ),
  record: document.getElementById( 'record' ),
  level: document.getElementById( 'level' ),
  lives: document.getElementById( 'lives' ),
};

function updateHud() {
  hud.score.textContent = state.score;
  hud.record.textContent = state.record;
  hud.level.textContent = state.level + '/' + LEVELS.length;

  hud.lives.textContent = '';
  for ( let i = 0; i < state.lives; i++ ) {
    const life = document.createElement( 'span' );
    life.className = 'hud__life';
    hud.lives.appendChild( life );
  }
  hud.lives.setAttribute( 'aria-label', state.lives + ' vidas' );
}

const keys = new Set();
const MAX_DT = 0.05;

let lastTime = null;

function clampPaddle() {
  const p = state.paddle;
  p.x = Math.max( p.w / 2, Math.min( GAME_W - p.w / 2, p.x ) );
}

function launch() {
  if ( state.phase !== 'menu' && state.phase !== 'playing' ) return;
  if ( !state.ball.attached ) return;

  const angle = ( Math.random() * 2 - 1 ) * LAUNCH_ANGLE_MAX;
  state.ball.vx = BALL.speed * Math.sin( angle );
  state.ball.vy = -BALL.speed * Math.cos( angle );
  state.ball.attached = false;
  state.phase = 'playing';
}

function togglePause() {
  if ( state.phase === 'playing' ) state.phase = 'paused';
  else if ( state.phase === 'paused' ) state.phase = 'playing';
}

function updatePaddle( dt ) {
  const p = state.paddle;
  let dir = 0;
  if ( keys.has( 'arrowleft' ) || keys.has( 'a' ) ) dir -= 1;
  if ( keys.has( 'arrowright' ) || keys.has( 'd' ) ) dir += 1;
  if ( dir !== 0 ) p.x += dir * PADDLE.speed * dt;
  clampPaddle();
}

function reflectPaddle() {
  const b = state.ball;
  const p = state.paddle;
  if ( b.vy <= 0 ) return false;

  const left = p.x - p.w / 2;
  const right = p.x + p.w / 2;
  if ( b.x + b.r < left || b.x - b.r > right ) return false;
  if ( b.y - b.r > p.y + p.h || b.y + b.r < p.y ) return false;

  const t = Math.max( -1, Math.min( 1, ( b.x - p.x ) / ( p.w / 2 ) ) );
  const angle = t * BOUNCE_ANGLE_MAX;

  let vx = BALL.speed * Math.sin( angle );
  let vy = BALL.speed * Math.cos( angle );

  if ( vy < BOUNCE_MIN_VY ) {
    const horizontal = Math.sqrt( BALL.speed * BALL.speed - BOUNCE_MIN_VY * BOUNCE_MIN_VY );
    vx = vx < 0 ? -horizontal : horizontal;
    vy = BOUNCE_MIN_VY;
  }

  b.vx = vx;
  b.vy = -vy;
  b.y = p.y - b.r;
  playSound( 'bounce' );
  return true;
}

function brickOverlap( b, brick ) {
  return {
    x: Math.min( b.x + b.r, brick.x + brick.w ) - Math.max( b.x - b.r, brick.x ),
    y: Math.min( b.y + b.r, brick.y + brick.h ) - Math.max( b.y - b.r, brick.y ),
  };
}

function spawnParticles( brick ) {
  const cx = brick.x + brick.w / 2;
  const cy = brick.y + brick.h / 2;

  for ( let i = 0; i < PARTICLE.count; i++ ) {
    const angle = Math.random() * Math.PI * 2;
    const speed = PARTICLE.speedMin + Math.random() * ( PARTICLE.speedMax - PARTICLE.speedMin );
    state.particles.push( {
      x: cx,
      y: cy,
      vx: Math.cos( angle ) * speed,
      vy: Math.sin( angle ) * speed,
      life: PARTICLE.life,
      color: brick.color,
    } );
  }
}

function breakBrick( brick ) {
  brick.alive = false;
  state.score += POINTS_PER_BRICK;
  state.explosions.push( { x: brick.x, y: brick.y, color: brick.color, start: performance.now() } );
  spawnParticles( brick );
  playSound( 'break' );
  updateHud();
}

function collideBricks() {
  const b = state.ball;
  let hit = null;
  let deepest = 0;

  for ( const brick of state.bricks ) {
    if ( !brick.alive ) continue;
    const o = brickOverlap( b, brick );
    if ( o.x <= 0 || o.y <= 0 ) continue;
    const depth = Math.max( o.x, o.y );
    if ( depth > deepest ) {
      deepest = depth;
      hit = { brick, o };
    }
  }

  if ( !hit ) return false;

  const brick = hit.brick;
  const o = hit.o;

  if ( o.x < o.y ) {
    if ( b.vx > 0 ) b.x -= o.x;
    else if ( b.vx < 0 ) b.x += o.x;
    b.vx = -b.vx;
  } else {
    if ( b.vy > 0 ) b.y -= o.y;
    else if ( b.vy < 0 ) b.y += o.y;
    b.vy = -b.vy;
  }

  breakBrick( brick );
  return true;
}

function reflectWalls() {
  const b = state.ball;
  if ( b.y - b.r < 0 ) {
    b.y = b.r;
    b.vy = Math.abs( b.vy );
    playSound( 'bounce' );
  }
  if ( b.x - b.r < 0 ) {
    b.x = b.r;
    b.vx = Math.abs( b.vx );
    playSound( 'bounce' );
  }
  if ( b.x + b.r > GAME_W ) {
    b.x = GAME_W - b.r;
    b.vx = -Math.abs( b.vx );
    playSound( 'bounce' );
  }
}

function loseBall() {
  state.lives -= 1;
  updateHud();

  if ( state.lives > 0 ) {
    state.ball.attached = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    attachBall();
    return;
  }

  state.phase = 'gameOver';
  state.ball.attached = true;
  state.ball.vx = 0;
  state.ball.vy = 0;
  updateRecord();
}

function updateBall( dt ) {
  if ( state.phase !== 'menu' && state.phase !== 'playing' ) return;
  const b = state.ball;
  if ( b.attached ) return;

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  reflectWalls();
  if ( reflectPaddle() ) return;
  collideBricks();

  if ( !state.bricks.some( brick => brick.alive ) ) {
    state.phase = state.level === LEVELS.length ? 'victory' : 'levelClear';
    state.ball.attached = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    if ( state.phase === 'victory' ) updateRecord();
    return;
  }

  if ( b.y - b.r > GAME_H ) loseBall();
}

function updateParticles( dt ) {
  const ms = dt * 1000;

  for ( let i = state.particles.length - 1; i >= 0; i-- ) {
    const p = state.particles[ i ];
    p.life -= ms;
    if ( p.life <= 0 ) {
      state.particles.splice( i, 1 );
      continue;
    }
    p.vy += PARTICLE.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
}

function updateInput( dt ) {
  if ( state.phase !== 'menu' && state.phase !== 'playing' ) return;
  updatePaddle( dt );
  if ( state.ball.attached ) attachBall();
}

canvas.addEventListener( 'mousemove', e => {
  if ( state.phase === 'paused' ) return;
  const rect = canvas.getBoundingClientRect();
  state.paddle.x = ( e.clientX - rect.left ) * ( GAME_W / rect.width );
  clampPaddle();
} );

window.addEventListener( 'keydown', e => {
  if ( e.key.startsWith( 'Arrow' ) || e.key === ' ' ) e.preventDefault();
  keys.add( e.key.toLowerCase() );

  if ( e.key.toLowerCase() === 'm' ) {
    state.muted = !state.muted;
    save();
    return;
  }

  if ( e.key.toLowerCase() === 'p' ) {
    if ( state.phase === 'playing' || state.phase === 'paused' ) togglePause();
    return;
  }

  if ( e.key === ' ' && state.phase === 'paused' ) {
    togglePause();
    return;
  }

  if ( e.key === ' ' && state.phase === 'playing' && !state.ball.attached ) {
    togglePause();
    return;
  }

  if ( e.key === 'Enter' && state.phase === 'levelClear' ) {
    state.level += 1;
    buildLevel( state.level );
    attachBall();
    state.phase = 'playing';
    updateHud();
    return;
  }

  if ( e.key === 'Enter' && ( state.phase === 'victory' || state.phase === 'gameOver' ) ) {
    restart();
    return;
  }

  if ( e.key === ' ' || e.key === 'Enter' ) launch();
} );

window.addEventListener( 'keyup', e => {
  keys.delete( e.key.toLowerCase() );
} );

canvas.addEventListener( 'click', launch );

function loop( now ) {
  const dt = lastTime === null ? 0 : Math.min( ( now - lastTime ) / 1000, MAX_DT );
  lastTime = now;

  ctx.clearRect( 0, 0, GAME_W, GAME_H );
  updateInput( dt );
  updateBall( dt );
  if ( state.phase !== 'paused' ) updateParticles( dt );
  drawBricks();
  drawExplosions();
  drawParticles();
  drawPaddle();
  drawBall();
  drawPhase();
  drawMuted();
  requestAnimationFrame( loop );
}

loadSettings();
buildLevel( state.level );
attachBall();
updateHud();

loadSpritesheet( () => requestAnimationFrame( loop ) );