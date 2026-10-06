# SPEC 04 — Menos ladrillos (o más grandes)

> **Estado:** Borrador
> **Depende de:** SPEC 03
> **Fecha:** 2026-10-06
> **Objetivo:** Reducir la cantidad de ladrillos por nivel para que la partida sea menos tediosa.

## Por qué existe esta spec

El usuario, tras jugar a la SPEC 03, encuentra que hay demasiados ladrillos que destruir y la partida se hace aburrida. La spec propone dos direcciones y aún no se ha decidido cuál.

## Opciones (pendiente de decisión)

1. **Menos filas por nivel** — recortar los diseños de `LEVELS` (por ejemplo 8→5 filas en el nivel 1). Cambio pequeño: no se toca `BRICK`, ni `GRID`, ni la geometría.
2. **Ladrillos más grandes** — subir `BRICK.w`/`BRICK.h` y reducir columnas/filas a la vez. Se ven mejor pero hay que rediseñar los 5 niveles y recalcular el encaje en la cuadrícula.

## Alcance

*(pendiente de decidir la opción)*

- `game.js`: ajuste de `LEVELS` (y `BRICK`/`GRID` si se elige la opción 2).
- `style.css`, `index.html`, `assets/`: sin cambios.

**Fuera de alcance:**

- Power-ups, bloques de varios golpes, bloques irrompibles.
- Cambios en los sonidos o en la progresión de niveles.
- Cualquier cambio en `assets/`.

## Criterios de aceptación

*(pendiente)*

## Decisiones

- **Pendiente:** opción 1 (menos filas) u opción 2 (ladrillos más grandes).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Cambiar `BRICK` rompe el criterio "nivel 1 idéntico al de la SPEC 01" | Si se elige la opción 2, actualizar también ese criterio en esta spec |
