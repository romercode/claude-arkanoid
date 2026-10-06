# SPEC 03 — Niveles múltiples y sonido

> **Estado:** Aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-06
> **Objetivo:** Añadir 5 niveles con progresión hasta una pantalla de victoria y sonidos de rebote y rotura con silenciador persistente.

## Por qué existe esta spec

El usuario pidió niveles y sonidos en la misma entrega. Además, `game.js` no tiene todavía varias cosas que la SPEC 01 da por hechas: los mensajes con `fillText`, la fase `levelClear`, el reinicio con `Enter` y el récord en `localStorage`. La progresión de niveles necesita justo esas piezas, así que esta spec las recoge; la pausa con `P`/`Esc` no las necesita y queda fuera.

## Alcance

**Dentro:**

- `index.html`: nuevo `.hud__item` con etiqueta `Nivel` y valor `#level`, colocado después de `#record`.
- `style.css`: sin cambios. El nuevo elemento reutiliza `hud__item` y `hud__value`.
- `game.js`: formato `segs` en las filas, constante `LEVELS` con 5 diseños y `buildLevel( n )`.
- `state.level` (1–5) y `state.phase` con los valores nuevos `levelClear` y `victory`.
- Detección de fin de nivel al final de `updateBall()` y avance con `Enter`.
- Mensajes centrados con `fillText` para `menu`, `levelClear`, `victory` y `gameOver`.
- Reinicio completo con `Enter` en `victory` y `gameOver`.
- Persistencia de `{ score, muted }` en `localStorage["arkanoid:v1"]` con fallback a memoria.
- `SOUNDS` con `ball-bounce.mp3` (volumen 0.5) y `break-sound.mp3` (volumen 0.7), y un `playSound( name )` con pool de 4 instancias por sonido.
- Sonido en el rebote de la pala, en los tres rebotes de pared y en la rotura de bloques.
- Tecla `M` que alterna el silencio y lo persiste, con rótulo `Sin sonido` en el canvas.

**Fuera de alcance (para specs futuras):**

- Pausa con `P`/`Esc`, que sigue siendo un hueco de la SPEC 01.
- Sonidos de victoria, derrota o cambio de nivel; no hay assets y generar tonos con Web Audio queda fuera.
- Volumen ajustable con teclas.
- Persistencia del nivel alcanzado; al recargar siempre se empieza en el nivel 1.
- Selector de nivel desde el menú.
- Power-ups, bloques de varios golpes y bloques irrompibles.
- Módulos ES, `audio.js`, bundler o dependencias.

## Modelo de datos

```js
// Cada nivel es un array de filas. Cada fila tiene un color y una lista de
// tramos `segs`; un tramo es { offset, count } en columnas desde la izquierda.
// Los tramos de una fila no se solapan y van de izquierda a derecha.
const LEVELS = [
  [ // Nivel 1 — el tablero actual de la SPEC 01, sin huecos.
    { color: 'magenta', segs: [ { offset: 4, count: 11 } ] },
    { color: 'hotpink', segs: [ { offset: 3, count: 13 } ] },
    { color: 'red',     segs: [ { offset: 3, count: 13 } ] },
    { color: 'green',   segs: [ { offset: 2, count: 15 } ] },
    { color: 'yellow',  segs: [ { offset: 2, count: 15 } ] },
    { color: 'cyan',    segs: [ { offset: 1, count: 17 } ] },
    { color: 'gray',    segs: [ { offset: 1, count: 17 } ] },
    { color: 'red',     segs: [ { offset: 0, count: 19 } ] },
  ],
  [ // Nivel 2 — 9 filas, pasillo central de 3 columnas (8, 9, 10) hasta abajo.
    { color: 'magenta', segs: [ { offset: 5, count: 3 }, { offset: 11, count: 3 } ] },
    { color: 'hotpink', segs: [ { offset: 4, count: 4 }, { offset: 11, count: 4 } ] },
    { color: 'red',     segs: [ { offset: 3, count: 5 }, { offset: 11, count: 5 } ] },
    { color: 'green',   segs: [ { offset: 2, count: 6 }, { offset: 11, count: 6 } ] },
    { color: 'yellow',  segs: [ { offset: 1, count: 7 }, { offset: 11, count: 7 } ] },
    { color: 'cyan',    segs: [ { offset: 1, count: 7 }, { offset: 11, count: 7 } ] },
    { color: 'gray',    segs: [ { offset: 0, count: 8 }, { offset: 11, count: 8 } ] },
    { color: 'red',     segs: [ { offset: 0, count: 8 }, { offset: 11, count: 8 } ] },
    { color: 'magenta', segs: [ { offset: 0, count: 8 }, { offset: 11, count: 8 } ] },
  ],
  [ // Nivel 3 — 10 filas, dos pasillos de 2 columnas (4-5 y 13-14).
    { color: 'magenta', segs: [ { offset: 7, count: 5 } ] },
    { color: 'hotpink', segs: [ { offset: 6, count: 7 } ] },
    { color: 'red',     segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'green',   segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'yellow',  segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'cyan',    segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'gray',    segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'red',     segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'green',   segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
    { color: 'yellow',  segs: [ { offset: 0, count: 4 }, { offset: 6, count: 7 }, { offset: 15, count: 4 } ] },
  ],
  [ // Nivel 4 — 11 filas, rejilla: huecos verticales en 3, 7, 11 y 15.
    { color: 'magenta', segs: [ { offset: 4, count: 11 } ] },
    { color: 'hotpink', segs: [ { offset: 3, count: 13 } ] },
    { color: 'red',     segs: REJILLA },
    { color: 'green',   segs: REJILLA },
    { color: 'yellow',  segs: REJILLA },
    { color: 'cyan',    segs: REJILLA },
    { color: 'gray',    segs: REJILLA },
    { color: 'red',     segs: REJILLA },
    { color: 'green',   segs: REJILLA },
    { color: 'yellow',  segs: REJILLA },
    { color: 'cyan',    segs: REJILLA },
  ],
  [ // Nivel 5 — 12 filas, muro denso con pasillos de 1 columna (4 y 14).
    { color: 'magenta', segs: [ { offset: 5, count: 9 } ] },
    { color: 'hotpink', segs: MURO },
    // ... 10 filas más con `MURO`
  ],
];

// Constantes de nivel declaradas junto a LEVELS:
// REJILLA = [ { offset: 0, count: 3 }, { offset: 4, count: 3 },
//             { offset: 8, count: 3 }, { offset: 12, count: 3 },
//             { offset: 16, count: 3 } ]
// MURO = [ { offset: 0, count: 4 }, { offset: 5, count: 9 }, { offset: 15, count: 4 } ]
```

```js
// Estado — sólo cambian `level` y `muted`; `phase` gana dos valores.
const state = {
  phase: 'menu',   // 'menu' | 'playing' | 'levelClear' | 'victory' | 'gameOver'
  level: 1,        // 1-based; LEVELS.length es el total
  muted: false,
  // ... resto igual a la SPEC 02: score, lives, record, paddle, ball, bricks, explosions, particles
};

// Sonidos: sólo los dos mp3 existentes.
const SOUNDS = {
  bounce: { src: 'assets/sounds/ball-bounce.mp3', volume: 0.5 },
  break:  { src: 'assets/sounds/break-sound.mp3', volume: 0.7 },
};
const SOUND_POOL = 4; // instancias simultáneas por sonido

// Persistencia: la clave sigue siendo `arkanoid:v1`; el valor pasa de { score }
// a { score, muted }. Un único save() escribe los dos campos.
{ score: 0, muted: false }
```

Convenciones (las mismas que las SPEC 01 y 02): origen arriba a la izquierda, velocidades en px/s, tiempos de animación en milisegundos, `dt` en segundos, parámetros con espacio (`function name( a, b )`) y todo el código en `game.js`.

## Plan de implementación

1. Renombrar `LEVEL` a `LEVELS` con el formato `segs`, conteniendo de momento sólo el nivel 1 (las mismas 8 filas de hoy), y cambiar `buildLevel()` por `buildLevel( n )` que recorre `LEVELS[ n - 1 ]`. Añadir `state.level = 1` y llamar `buildLevel( state.level )` al arranque. Prueba manual: el tablero es idéntico al actual y no hay errores en consola.
2. Añadir a `LEVELS` los niveles 2 a 5 con sus diseños. Prueba manual: `LEVELS.length` es 5 y el juego sigue arrancando en el nivel 1 idéntico.
3. Añadir el `.hud__item` de `Nivel` con `#level` en `index.html`, `hud.level` en `game.js` y la línea `hud.level.textContent = state.level + '/' + LEVELS.length` dentro de `updateHud()`. Prueba manual: el HUD muestra `1/5`.
4. Acotar `updateInput()` y `updateBall()` a las fases `menu` y `playing`, y comprobar al final de `updateBall()` (después de `collideBricks()`) si no queda ningún bloque con `alive === true`. Prueba manual: al romper el último bloque la bola se congela.
5. Manejar `Enter` en `levelClear`: `state.level++`, `buildLevel( state.level )`, `attachBall()`, `phase = 'playing'` y `updateHud()`. Prueba manual: `Enter` abre el nivel 2, el HUD marca `2/5`, y puntuación y vidas siguen igual.
6. En la misma comprobación, si `state.level === LEVELS.length` poner `phase = 'victory'` en lugar de `levelClear`. Manejar `Enter` en `victory` y en `gameOver` con un `restart()` que deja nivel 1, 0 puntos, 3 vidas, tablero reconstruido y `phase = 'menu'`. Prueba manual: con `LEVELS` reducido a un nivel en local, limpiar muestra victoria y `Enter` reinicia.
7. Crear `drawMessage( lines )` con `fillText` centrado sobre un rectángulo semitransparente, y `drawPhase()` con los mensajes de `menu` (instrucciones y `M para silenciar`), `levelClear`, `victory` y `gameOver`. Llamar a `drawPhase()` al final de `loop()`. Prueba manual: los cuatro mensajes se ven legibles.
8. Crear `loadSettings()` y `save()` con `try`/`catch` sobre `arkanoid:v1` y valor `{ score, muted }`. Cargar el récord al arrancar y llamar a `save()` al entrar en `gameOver` o `victory` sólo si `state.score > state.record`. Prueba manual: recargar conserva el récord; con `localStorage` bloqueado el juego sigue jugable.
9. Crear `soundPools` con 4 `Audio` por sonido (`preload = 'auto'`, `volume` de `SOUNDS`) y `playSound( name )` que coge la siguiente instancia en round-robin, rebobina y llama a `play().catch( () => {} )`. Cablear `playSound( 'bounce' )` en `reflectPaddle()` y en las tres ramas que reflejan de `reflectWalls()`, y `playSound( 'break' )` en `breakBrick()`. Prueba manual: rebotes y roturas suenan; una fila rota de golpe no corta los golpes.
10. Manejar `M` en el `keydown`: alternar `state.muted` y llamar a `save()`. Prueba manual: `M` silencia y reactiva, y tras recargar el estado se conserva.
11. Dibujar `Sin sonido` en la esquina superior derecha del canvas cuando `state.muted` sea `true`. Prueba manual: el rótulo aparece y desaparece con `M` en cualquier fase.

## Criterios de aceptación

- [ ] `index.html` se abre con doble clic (`file://`) sin errores en la consola.
- [ ] El HUD muestra la etiqueta `Nivel` con el valor `1/5` desde el primer fotograma.
- [ ] El tablero del nivel 1 es exactamente el de la SPEC 01: mismas 8 filas, colores, offsets y counts.
- [ ] Los 5 niveles se pueden alcanzar jugando y cada uno muestra un tablero distinto al anterior.
- [ ] Romper el último bloque de un nivel no final muestra el mensaje de nivel superado y detiene la bola.
- [ ] `Enter` en el nivel superado pasa al nivel siguiente con puntuación y vidas intactas y la bola pegada a la pala.
- [ ] El HUD del nivel se actualiza al avanzar.
- [ ] Limpiar el quinto nivel muestra la pantalla de victoria en lugar de nivel superado.
- [ ] `Enter` en victoria reinicia en el nivel 1 con 0 puntos, 3 vidas y el tablero completo.
- [ ] `Enter` en fin de partida reinicia en el nivel 1 con 0 puntos, 3 vidas y el tablero completo.
- [ ] El menú muestra su mensaje con las instrucciones de lanzamiento y de silencio.
- [ ] Romper un bloque reproduce `assets/sounds/break-sound.mp3`.
- [ ] El rebote en la pala y los tres rebotes de pared reproducen `assets/sounds/ball-bounce.mp3`.
- [ ] Romper una fila entera en un mismo frame reproduce varios golpes sin errores en consola.
- [ ] La tecla `M` silencia y reactiva los dos sonidos.
- [ ] El rótulo `Sin sonido` se ve en el canvas mientras está silenciado y desaparece al reactivar.
- [ ] El estado de silencio sobrevive a recargar la página.
- [ ] El récord se guarda en `localStorage["arkanoid:v1"]` con valor `{ score, muted }` y sólo se actualiza si la puntuación lo supera.
- [ ] Recargar la página conserva el récord y el estado de silencio.
- [ ] Si `localStorage` lanza una excepción, el juego sigue jugable y sólo pierde la persistencia.
- [ ] Si un `.mp3` no se puede reproducir, el juego sigue jugable y sólo pierde el sonido.
- [ ] Ningún archivo de `assets/` ha sido modificado.

## Decisiones

- **Sí:** una sola spec para niveles y sonido, decisión del usuario en la fase de preguntas; dos specs habrían sido más pequeñas pero un solo ciclo es más ágil.
- **Sí:** 5 niveles fijos en código. La dificultad viene sólo del diseño; la bola mantiene 300 px/s en todos, así que no hay que retocar `BALL.speed`.
- **Sí:** formato `segs` (lista de tramos por fila). El formato `{ offset, count }` sólo admite tramos contiguos y los niveles nuevos necesitan huecos.
- **Sí:** niveles simétricos con los huecos alineados hasta la fila inferior. Un hueco que no llega abajo no deja pasar la bola y es decorativo.
- **Sí:** puntuación y vidas se conservan al avanzar de nivel. Decisión del usuario.
- **No:** bonificación al superar un nivel. Decisión del usuario; sólo valen los 10 puntos por bloque.
- **Sí:** fase `victory` propia, distinta de `levelClear`, porque las dos tienen mensaje y reinicio distintos.
- **Sí:** mensajes con `fillText` centrado sobre un rectángulo semitransparente. Convención de la SPEC 01, y el fondo semitransparente los hace legibles sobre los bloques.
- **No:** pausa con `P`/`Esc`. Es un hueco de la SPEC 01 que no necesita esta spec y merece su propio ciclo.
- **Sí:** persistir `{ score, muted }` en la misma clave `arkanoid:v1` y con un único `save()` que escribe los dos campos, para que guardar el silencio no borre el récord y viceversa. Migración: los datos antiguos `{ score }` se leen con `muted` por defecto `false`.
- **Sí:** pool de 4 `Audio` por sonido en round-robin. Romper una fila dispara varios golpes en el mismo frame y una sola instancia se cortaría a sí misma.
- **Sí:** volumen 0.5 para el rebote y 0.7 para la rotura. La rotura es el evento que debe destacar.
- **Sí:** `play().catch( () => {} )` en cada reproducción. El navegador puede rechazar el audio y el bucle no debe romperse.
- **Sí:** todo el código en `game.js`. Decisión del usuario y convención de las dos specs anteriores.
- **Sí:** rótulo `Sin sonido` en el canvas. Sin indicador el jugador no sabe si `M` ha funcionado.
- **No:** sonido de victoria, derrota o cambio de nivel. No hay assets y tonos generados con Web Audio quedan fuera.
- **No:** sonido al rebotar contra un bloque. Los bloques son de un solo golpe: el rebote se convierte siempre en rotura y ya suena `break-sound`.
- **No:** persistir el nivel alcanzado. Decisión del usuario; al recargar se empieza en el nivel 1.
- **No:** `audio.js`, módulos ES, bundler ni dependencias.
- **No:** volumen ajustable con teclas.
- **No:** tocar `assets/spritesheet.js` ni el PNG.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El navegador bloquea `play()` antes de una interacción del usuario | Sólo hay sonido tras lanzar la bola con `Espacio` o click, que ya es una interacción; además cada `play()` lleva `.catch( () => {} )` |
| Un `.mp3` no existe o `file://` no lo sirve | `play()` rechaza y el error se traga; el juego sigue jugable y en silencio |
| Romper una fila entera lanza 5 o más reproducciones en el mismo frame | Pool de 4 instancias por sonido con índice round-robin |
| `localStorage` bloqueado en modo privado o con cuota llena | `try`/`catch` en lectura y escritura; récord y silencio quedan en memoria |
| Datos antiguos `{ score }` sin el campo `muted` | Lectura con `muted` por defecto `false`; la siguiente escritura ya guarda los dos campos |
| Congelar la física en `levelClear` y `victory` deja partículas a medias | El dibujado sigue en todas las fases; sólo se deja de actualizar, así que las partículas se purgan al reanudar o al reconstruir el nivel |
| Un nivel de 12 filas deja poco espacio para reaccionar | La fila más baja acaba en y = 312 y la pala empieza en y = 560: quedan 248 px de juego |
| Los mensajes `fillText` quedan ilegibles sobre los bloques | Se dibujan sobre un rectángulo semitransparente |

## Lo que **no** entra en esta spec

- Pausa con `P`/`Esc` (hueco de la SPEC 01, va en su propia spec).
- Sonidos de victoria, derrota o cambio de nivel y tonos con Web Audio.
- Volumen ajustable con teclas.
- Persistencia del nivel alcanzado y selector de nivel.
- Power-ups, bloques de varios golpes y bloques irrompibles.
- Módulos ES, `audio.js`, bundler o dependencias; y cualquier cambio en `assets/`.

Cada uno de esos, si aterriza, va en su propia spec.
