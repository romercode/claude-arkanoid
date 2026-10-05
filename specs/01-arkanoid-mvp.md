# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-05
> **Objetivo:** Juego de Arkanoid jugable en el navegador con una pala, una bola, un nivel fijo de bloques rompibles, 3 vidas y puntuación con récord persistente.

## Por qué existe esta spec

El proyecto sólo tiene `Readme.md` y `assets/`. Esta spec fija el mínimo jugable completo antes de escribir una línea de código, y fija también las convenciones que ya no son negociables: sin dependencias, sin build, y `assets/spritesheet.js` cargado como script clásico porque expone globals (`loadSpritesheet`, `drawSprite`, `drawFrame`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`) y no usa `export`.

## Alcance

**Dentro:**

- `index.html` con un `<canvas>` de 640x480, fondo negro y centrado, y un HUD en HTML (`#score`, `#record`, `#lives`).
- `style.css` con el layout de página, el HUD y `image-rendering` para que los sprites no se suavicen.
- `game.js` como script clásico con el juego entero: constantes, estado, bucle, entrada, colisiones, dibujado y récord.
- Un único nivel fijo definido en código, con los 7 colores de `SPRITES.blocks`.
- Pila, bola, 3 vidas, 10 puntos por bloque, explosión de 150 ms al romper.
- Estados `menu`, `playing`, `paused`, `levelClear` y `gameOver`.
- Récord máximo en `localStorage` con la clave `arkanoid:v1` y fallback en memoria.

**Fuera de alcance (para specs futuras):**

- Cualquier sonido (`assets/sounds/*.mp3` no se usan en esta spec).
- Power-ups, bloques con varios golpes, bloques irrompibles y aumento de velocidad de la bola.
- Más de un nivel, selector de nivel y pantalla de victoria con progresión.
- Soporte táctil, responsive y escalado del canvas.
- Tabla de récords (solo se guarda y muestra el máximo actual).

## Modelo de datos

```js
// Constantes — px, segundos y milisegundos. Origen arriba a la izquierda.
const GAME_W = 640;
const GAME_H = 480;

const PADDLE = { w: 120, h: 14, y: GAME_H - 40, speed: 600 }; // px/s
const BALL = { size: 16, r: 8, speed: 300 };                 // px/s
const BRICK = { w: 32, h: 16, gap: 8 };                      // tamaño nativo del sprite
const GRID = { top: 48, left: 32 };                          // esquina superior izquierda de la cuadrícula
const LIVES_START = 3;
const POINTS_PER_BRICK = 10;
const RECORD_KEY = 'arkanoid:v1';
const LAUNCH_ANGLE_MAX = 30 * Math.PI / 180;                 // desviación máxima al lanzar

// Un nivel: filas ordenadas de arriba abajo. `offset` en columnas desde la
// izquierda, `count` en bloques, `color` es un nombre de SPRITES.blocks.
const LEVEL = [
  { color: 'magenta', offset: 4, count: 11 },
  { color: 'hotpink', offset: 3, count: 13 },
  { color: 'red',     offset: 3, count: 13 },
  { color: 'green',   offset: 2, count: 15 },
  { color: 'yellow',  offset: 2, count: 15 },
  { color: 'cyan',    offset: 1, count: 17 },
  { color: 'gray',    offset: 1, count: 17 },
  { color: 'red',     offset: 0, count: 19 },
];
```

```js
// Estado del juego. `phase` es la única fuente de verdad de la pantalla actual.
const state = {
  phase: 'menu',            // 'menu' | 'playing' | 'paused' | 'levelClear' | 'gameOver'
  score: 0,
  lives: 3,
  record: 0,                // leído de localStorage; en memoria si falla
  paddle: { x: GAME_W / 2, y: PADDLE.y, w: PADDLE.w, h: PADDLE.h },
  ball: { x: 0, y: 0, vx: 0, vy: 0, r: BALL.r, attached: true },
  bricks: [],               // [ { x, y, w, h, color, alive: true } ]
  explosions: [],           // [ { x, y, color, start } ] — `start` es performance.now()
};
```

```js
// Persistencia del récord. Falla silenciosamente a memoria si localStorage lanza.
function loadRecord() {
  try {
    const raw = localStorage.getItem( RECORD_KEY );
    const data = raw ? JSON.parse( raw ) : null;
    return ( data && typeof data.score === 'number' ) ? data.score : 0;
  } catch ( err ) {
    return 0; // modo privado o cuota llena: el juego sigue, sin persistencia
  }
}

function saveRecord( score ) {
  try {
    localStorage.setItem( RECORD_KEY, JSON.stringify( { score } ) );
  } catch ( err ) { /* sin persistencia, el récord sigue visible en memoria */ }
}
```

Convenciones:

- Origen arriba a la izquierda; el ancho y alto vienen de `GAME_W` / `GAME_H`.
- Velocidades en **píxeles por segundo** y `dt` en segundos, porque el bucle normaliza por delta.
- Tiempos de animación en **milisegundos** (`performance.now()`), como `EXPLOSION_DURATION`.
- Los nombres de color son exactamente las claves de `SPRITES.blocks`; el sprite se pide como `block_<color>`.
- Todo el estado cuelga de `state`; funciones en `camelCase`; los parámetros siguen el espacio de `assets/spritesheet.js` (`function name( a, b )`).

## Plan de implementación

1. Crear `index.html` con el HUD (`#score`, `#record`, `#lives`), el `<canvas width="640" height="480">` y los scripts en este orden: `assets/spritesheet.js` y después `game.js`. Enlazar `style.css`. Prueba manual: abrir el archivo, ver el rectángulo negro, el HUD en `0 / 0 / 3`.
2. Crear `style.css`: fondo de página oscuro, canvas centrado con borde, HUD en una fila con etiquetas `Puntuación`, `Récord` y `Vidas`. Prueba manual: la página se ve centrada sin scroll.
3. Crear `game.js` con constantes, `LEVEL`, `state` inicial y `loadSpritesheet( () => requestAnimationFrame( loop ) )`. No se dibuja nada todavía. Prueba manual: abrir sin errores en consola.
4. Añadir `buildLevel()` y el dibujado de bloques con `drawSprite( ctx, 'block_' + color, x, y, 32, 16 )`. Prueba manual: las 8 filas de bloques se ven en pantalla.
5. Añadir el dibujado de pala y bola con `drawSprite` en el estado inicial. Prueba manual: se ve la pala abajo y la bola pegada a ella.
6. Implementar entrada de la pala con `mousemove` (posición del ratón → centro de la pala, acotada a la pantalla) y con `ArrowLeft`/`ArrowRight` y `A`/`D` (velocidad `PADDLE.speed`), y la actualización de la bola mientras `attached` es `true`. Prueba manual: la pala sigue al ratón y a las teclas.
7. Implementar el lanzamiento: `Espacio`, `Enter` o click durante `menu` o con `attached === true`, con ángulo aleatorio dentro de `±LAUNCH_ANGLE_MAX` hacia arriba. Prueba manual: la bola sale en direcciones distintas.
8. Implementar el bucle con `requestAnimationFrame`, `dt` normalizado y tope de `dt` (por ejemplo `0.05` s) para que una pestaña en segundo plano no teletransporte la bola; integrar la bola y reflejar en los bordes superior, izquierdo y derecho. Prueba manual: la bola va a la misma velocidad visiblemente en un monitor de 60 y de 144 Hz.
9. Implementar la colisión bola–pala por solapamiento AABB, con el ángulo de salida calculado a partir del punto de impacto y `vy` forzado hacia arriba con un mínimo de velocidad vertical; como máximo una reflexión por frame. Prueba manual: golpear con el borde de la pala devuelve la bola en diagonal y nunca se queda horizontaleada.
10. Implementar la colisión bola–bloques por AABB, resuelta por el eje de menor penetración; marcar `alive = false`, sumar `POINTS_PER_BRICK` y registrar la explosión `{ x, y, color, start }`. Prueba manual: la bola rebota, desaparece un bloque y la puntuación sube en 10.
11. Implementar la animación de explosión con `drawFrame( ctx, EXPLOSION_FRAMES[color][i], ... )` y `EXPLOSION_DURATION`, purgada al terminar, **sin** detener el bucle. Prueba manual: se ve la explosión de 4 frames y la bola sigue moviéndose.
12. Implementar la pérdida de bola: si `ball.y - ball.r > GAME_H`, restar una vida, refrescar el HUD y, si quedan vidas, volver a `attached = true` esperando `Espacio`; si no, `phase = 'gameOver'`. Prueba manual: al perder 3 veces aparece la pantalla de derrota.
13. Implementar `levelClear` cuando no queda ningún bloque con `alive === true`, y `Enter` en `levelClear` o `gameOver` para reiniciar la partida con puntuación a 0, 3 vidas y el nivel reconstruido.
14. Implementar `P` y `Esc` alternando `playing` ⇄ `paused`, y los mensajes de `menu`, `paused`, `levelClear` y `gameOver` dibujados dentro del canvas con `fillText` centrado.
15. Implementar `loadRecord()` al arrancar, actualizar el HUD con `state.record` y llamar a `saveRecord()` en `gameOver` sólo si `state.score > state.record`. Prueba manual: recargar conserva el récord; con `localStorage` bloqueado el juego sigue jugable.

## Criterios de aceptación

- [ ] `index.html` se abre con doble clic (`file://`) sin errores en la consola.
- [ ] El canvas mide 640x480, está centrado y tiene fondo negro.
- [ ] El HUD muestra `Puntuación`, `Récord` y `Vidas` desde el primer fotograma.
- [ ] La pala se mueve con el ratón, con `ArrowLeft`/`ArrowRight` y con `A`/`D`, y no sale de la pantalla.
- [ ] `Espacio`, `Enter` y el click lanzan la bola desde la pala.
- [ ] La bola rebota en los bordes superior, izquierdo y derecho.
- [ ] El punto de impacto en la pala cambia el ángulo del rebote y la bola nunca queda en trayectoria horizontal tras la pala.
- [ ] Las 8 filas del nivel se dibujan con los sprites `block_<color>` del spritesheet.
- [ ] Romper un bloque suma exactamente 10 puntos.
- [ ] Romper un bloque muestra su explosión de 4 frames durante 150 ms y el juego no se detiene mientras ocurre.
- [ ] Perder la bola descuenta una vida, decrementa el HUD y devuelve la bola a la pala esperando `Espacio`.
- [ ] Al perder la tercera vida aparece `gameOver` con la puntuación final.
- [ ] Limpiar todos los bloques muestra `levelClear`.
- [ ] `Enter` en `levelClear` o `gameOver` reinicia la partida con 0 puntos, 3 vidas y el nivel completo.
- [ ] `P` y `Esc` pausan y reanudan la partida.
- [ ] El récord se lee de `localStorage["arkanoid:v1"]` y se actualiza sólo si la puntuación lo supera.
- [ ] Recargar la página conserva el récord.
- [ ] Si `localStorage` lanza una excepción, el juego sigue siendo jugable y sólo pierde la persistencia.
- [ ] Ningún archivo de `assets/` ha sido modificado.

## Decisiones

- **Sí:** un único `game.js`. Es el MVP completo y se lee de arriba abajo; dividirlo ahora es ceremonia que el proyecto todavía no necesita.
- **No:** módulos ES (`type="module"`), bundler, `package.json` o cualquier build. `assets/spritesheet.js` es un script clásico y el proyecto no tiene dependencias.
- **No:** servidor local. La página debe funcionar con `file://`, por eso los scripts son clásicos y en orden explícito.
- **Sí:** un solo nivel fijo en código. La condición de victoria es limpiar el tablero; los niveles múltiples van en otra spec.
- **Sí:** 10 puntos por bloque, constante. Cifra uniforme y fácil de razonar y de verificar.
- **No:** puntuación por color. Los 7 colores disponibles son decorativos y marcan filas; el valor por tipo se decide si algún día hay bloques especiales.
- **No:** bloques con varios golpes ni irrompibles. La única regla es "un impacto, un bloque roto".
- **Sí:** `requestAnimationFrame` con delta normalizado y velocidad en px/s. Sin esto la bola iría más rápido en pantallas de 144 Hz.
- **Sí:** rebote con ángulo según el punto de impacto en la pala. Es el comportamiento clásico de Arkanoid y evita la bola horizontaleada.
- **Sí:** explosión con `EXPLOSION_FRAMES` sin pausar el bucle. La animación es decorativa; el juego no puede frenarse por un bloque roto.
- **No:** sonido. Los `.mp3` existen en `assets/sounds/` pero quedan fuera de esta spec; el bucle de reproducción de audio se decide con la spec que los use.
- **No:** tocar `assets/spritesheet.js`. Incluido `EXPLOSION_FRAMES.gray`, que comparte coordenadas con `red`: se usa tal cual está.
- **Sí:** récord en `localStorage` con clave versionada `arkanoid:v1` y valor `{ score }`. La versión permite migrar el esquema después; el objeto permite añadir campos (fecha, nivel) sin cambiar la clave.
- **Sí:** fallback a memoria si `localStorage` lanza. El juego no puede dejar de jugarse por una restricción del navegador.
- **No:** git init en esta spec. El flujo de `/spec-impl` lo necesita, pero es una decisión aparte de la del juego.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `localStorage` bloqueado en modo privado o con cuota llena | `try`/`catch` en lectura y escritura; el récord queda en memoria y el juego sigue igual |
| La bola se teletransporta al volver de una pestaña en segundo plano | `dt` limitado a un máximo por fotograma |
| Dos bloques de la misma fila colisionan en el mismo fotograma | Se resuelve una sola colisión por fotograma, la de mayor penetración |
| La bola queda en trayectoria horizontal tras golpear con el borde de la pala | Al rebotar se fuerza `vy` con signo hacia arriba y una velocidad vertical mínima |
| El spritesheet todavía no ha cargado en el primer fotograma | Todo el bucle arranca dentro del callback de `loadSpritesheet`; `drawSprite` y `drawFrame` no hacen nada si la imagen no está |
| Sprites escalados por debajo de su tamaño nativo | `h` siempre coincide con la altura nativa del sprite (14, 16) y se usa `image-rendering: pixelated` |
| `/spec-impl` requiere git y el proyecto no es repo | Inicializar git antes de implementar; la spec no depende de ello |

## Lo que **no** entra en esta spec

- Sonido, con `assets/sounds/ball-bounce.mp3` y `assets/sounds/break-sound.mp3`.
- Power-ups, bloques de varios golpes, bloques irrompibles y aceleración de la bola.
- Más niveles, selector de nivel y progresión entre niveles.
- Controles táctiles, diseño responsive y escalado del canvas.
- Tabla de récords con fecha y nivel; sólo el máximo actual.

Cada uno de esos, si aterriza, va en su propia spec.
