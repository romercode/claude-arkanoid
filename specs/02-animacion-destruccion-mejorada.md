# SPEC 02 — Animación de destrucción de bloques mejorada

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-06
> **Objetivo:** Mantener la explosión de sprites de 150 ms al romper un bloque y añadirle una explosión de 10 partículas con gravedad que vive 400 ms.

## Por qué existe esta spec

La SPEC 01 implementó la destrucción de bloques con la explosión de 4 frames de `EXPLOSION_FRAMES`. Ese efecto dura 150 ms y se nota corto: el bloque desaparece casi sin rastro. Esta spec añade un segundo efecto encima, sin tocar `assets/`, para que romper un bloque se vea con más impacto.

## Alcance

**Dentro:**

- Constantes `PARTICLE` y `BLOCK_COLORS` en `game.js`.
- `state.particles`: array de partículas activas.
- Spawn de 10 partículas en `breakBrick()`, junto al registro de la explosión.
- Movimiento radial con velocidad aleatoria y gravedad hacia abajo.
- Vida de 400 ms por partícula, purgada dentro del bucle.
- Dibujado de las partículas con `fillRect` en el canvas, sin detener el bucle.
- La explosión de sprites de 150 ms se mantiene exactamente igual.

**Fuera de alcance (para specs futuras):**

- Sonido al romper (`assets/sounds/break-sound.mp3`).
- Puntos flotantes `+10` sobre el bloque destruido.
- Partículas en otros eventos: rebote en la paleta o en las paredes.
- Tocar `assets/spritesheet.js` o añadir píxeles al PNG.
- Power-ups, bloques de varios golpes y bloques irrompibles.

## Modelo de datos

```js
// Constantes nuevas en game.js — px, px/s, px/s² y milisegundos.
const PARTICLE = {
  count: 10,    // partículas por bloque roto
  life: 400,    // ms de vida de cada partícula
  speedMin: 60, // px/s, velocidad mínima de salida
  speedMax: 180,// px/s, velocidad máxima de salida
  gravity: 400, // px/s²
  size: 3,      // px de lado del cuadrado dibujado
};

// Color de relleno por nombre de bloque. El spritesheet no expone el color.
const BLOCK_COLORS = {
  magenta: '#ff00ff',
  hotpink: '#ff69b4',
  red:     '#ff0000',
  green:   '#00cc44',
  yellow:  '#ffe000',
  cyan:    '#00e5ff',
  gray:    '#9aa0a6',
};

// state.particles — nace vacío. Cada entrada dura 400 ms.
// { x, y, vx, vy, life, color }
// x, y: centro de la partícula en px; vx, vy en px/s;
// life: ms restantes, empieza en PARTICLE.life; color: clave de BLOCK_COLORS.
```

Convenciones (las mismas que la SPEC 01): origen arriba a la izquierda, velocidades en px/s, tiempos de animación en milisegundos y `dt` en segundos dentro del bucle.

## Plan de implementación

1. Añadir `PARTICLE` y `BLOCK_COLORS` al inicio de `game.js`, y `particles: []` dentro de `state`. Prueba manual: el juego arranca igual, sin errores en consola.
2. Crear `spawnParticles( brick )`, que empuja 10 partículas con dirección radial aleatoria desde el centro del bloque y `life = PARTICLE.life`. Llamarla desde `breakBrick()`. Prueba manual: al romper un bloque, `state.particles.length` pasa a 10.
3. Crear `updateParticles( dt )`: resta `dt * 1000` a `life`, suma `PARTICLE.gravity * dt` a `vy`, integra `x`/`y` y purga las partículas con `life <= 0`. Llamarlo en `loop()` después de `updateBall( dt )`. Prueba manual: las partículas caen y desaparecen a los 400 ms.
4. Crear `drawParticles()` con `fillRect` y `BLOCK_COLORS[p.color]`, llamado en `loop()` después de `drawExplosions()` y antes de `drawPaddle()`. Prueba manual: se ven cuadrados del color del bloque cayendo mientras la bola sigue moviéndose.
5. Acumular varias roturas en el mismo frame: `state.particles` admite entradas de distintos bloques y la purga ocurre en el mismo frame en el que cada partícula cumple 400 ms. Prueba manual: romper una fila entera no deja partículas muertas en el array.

## Criterios de aceptación

- [ ] Romper un bloque genera exactamente 10 partículas en `state.particles`.
- [ ] Las partículas nacen en el centro del bloque roto con dirección radial aleatoria.
- [ ] Las partículas caen hacia abajo: `vy` crece con el tiempo por la gravedad.
- [ ] Cada partícula desaparece a los 400 ms y `state.particles` queda vacío cuando no hay roturas recientes.
- [ ] La explosión de sprites sigue durando 150 ms y se dibuja junto a las partículas.
- [ ] Cada partícula se dibuja con el color de `BLOCK_COLORS` correspondiente al bloque roto.
- [ ] El bucle no se detiene durante el efecto: la bola y la paleta siguen respondiendo.
- [ ] Romper varios bloques en el mismo frame acumula las partículas de todos sin perder ninguna.
- [ ] `index.html` se abre con doble clic (`file://`) sin errores en la consola.
- [ ] Ningún archivo de `assets/` ha sido modificado.

## Decisiones

- **Sí:** explosión radial con gravedad leve. Da la sensación de fragmentos y es lo que se pidió; una caída vertical queda demasiado pasiva.
- **Sí:** 10 partículas y 400 ms. Suficiente para verse sin que el efecto opaque la explosión de sprites ni se alargue en exceso.
- **Sí:** mantener la explosión de sprites de 150 ms sin cambios. Ya funciona y es parte de la SPEC 01; esta spec la complementa, no la sustituye.
- **Sí:** mapa `BLOCK_COLORS` en `game.js`. El spritesheet sólo da coordenadas, así que el color de relleno hay que declararlo en algún sitio; un mapa plano es el sitio más simple.
- **Sí:** implementar todo en `game.js`. Sigue la decisión de la SPEC 01 de un único archivo que se lee de arriba abajo.
- **Sí:** `fillRect` en lugar de un sprite. No hay hoja de sprites de partículas y añadirla exigiría tocar `assets/`.
- **No:** sonido. `assets/sounds/break-sound.mp3` queda para una spec de audio.
- **No:** puntos flotantes `+10`. Es otro efecto con su propio modelo (texto, posición, vida) y merece spec aparte.
- **No:** partículas en rebotes de paleta o pared. Esta spec es sólo sobre destrucción de bloques.
- **No:** tocar `assets/spritesheet.js` ni el PNG. Regla fija del proyecto.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Roturas encadenadas acumulan partículas y el array crece sin control | Vida corta (400 ms) y purga en cada fotograma dentro de `updateParticles` |
| Las partículas tapen la pala o la bola | `drawParticles()` se dibuja antes que `drawPaddle()` y `drawBall()` |
| Un color nuevo en `LEVEL` sin entrada en `BLOCK_COLORS` pinta en negro | `BLOCK_COLORS` cubre los 7 colores de `SPRITES.blocks`; añadir un color obliga a añadir su entrada |
| El efecto rinde mal con cientos de partículas | `count: 10` por bloque y purga por frame mantienen el array en decenas, no en centenares |

## Lo que **no** entra en esta spec

- Sonido, con `assets/sounds/break-sound.mp3`.
- Puntos flotantes sobre el bloque destruido.
- Partículas en rebotes de paleta o de pared.
- Cambios en `assets/spritesheet.js` o en `assets/spritesheet-breakout.png`.
- Power-ups y bloques de varios golpes.

Cada uno de esos, si aterriza, va en su propia spec.
