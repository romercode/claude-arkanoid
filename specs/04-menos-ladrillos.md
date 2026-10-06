# SPEC 04 — Menos ladrillos (o más grandes)

> **Estado:** Implementado
> **Depende de:** SPEC 03
> **Fecha:** 2026-10-06
> **Objetivo:** Reducir la cantidad de ladrillos por nivel para que la partida sea menos tediosa.

## Por qué existe esta spec

El usuario, tras jugar a la SPEC 03, encuentra que hay demasiados ladrillos que destruir y la partida se hace aburrida. La spec propone dos direcciones y aún no se ha decidido cuál.

## Opciones

1. **Menos filas por nivel** — recortar los diseños de `LEVELS` (por ejemplo 8→5 filas en el nivel 1). Cambio pequeño: no se toca `BRICK`, ni `GRID`, ni la geometría. ✅ **Elegida.**
2. **Ladrillos más grandes** — subir `BRICK.w`/`BRICK.h` y reducir columnas/filas a la vez. Se ven mejor pero hay que rediseñar los 5 niveles y recalcular el encaje en la cuadrícula. ❌ Descartada.

## Alcance

- `game.js`: recorte de `LEVELS` a las **5 primeras filas** de cada nivel. Colores, offsets y counts de las filas conservadas no cambian.
- `BRICK`, `GRID` y `buildLevel()`: sin cambios.
- `style.css`, `index.html`, `assets/`: sin cambios.

**Fuera de alcance:**

- Power-ups, bloques de varios golpes, bloques irrompibles.
- Cambios en los sonidos o en la progresión de niveles.
- Cualquier cambio en `assets/`.

## Criterios de aceptación

- [x] `BRICK`, `GRID` y `buildLevel()` sin cambios; `style.css`, `index.html` y `assets/` sin tocar.
- [x] Los 5 niveles tienen 5 filas y conservan colores/offsets/counts originales (solo se eliminan filas enteras, las inferiores).
- [x] Ningún nivel supera 80 ladrillos; el total pasa de ~734 a ~320.
- [x] El tablero sigue encajando en la cuadrícula y el juego se puede completar los 5 niveles hasta la victoria.
- [x] Sin errores en consola; partículas, explosiones, sonidos y HUD funcionan igual que antes.

## Decisiones

- **Opción 1 (menos filas)**: elegida por el usuario el 2026-10-06.
- 5 filas por nivel en todos los niveles (uniforme).
- Se conservan las filas superiores; se eliminan las inferiores.
- Opción 2 (ladrillos más grandes): descartada, no toca `BRICK`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Los niveles 3-5 pierden sus filas patrón inferiores y se asemejan más entre sí | Aceptado: los patrones de cabecera (rejilla, muro) se conservan parcialmente y el número de ladrillos sigue creciendo por nivel |
