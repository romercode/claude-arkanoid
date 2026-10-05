# AGENTS.md

## Qué es este proyecto

Juego de Arkanoid en HTML + CSS + JavaScript **sin dependencias** (ver `Readme.md`). No hay `package.json`, bundler, build, linter, tests ni CI. No los añadas sin que se pidan: el proyecto se abre y se juega.

Docs y comunicación en **español** (ver `Readme.md`).

## Estado actual

El proyecto está praticamente vacío: solo `Readme.md` y `assets/`. **No es un repositorio git todavía.** No hay `index.html` ni código de juego.

## Assets (ya existentes, no regenerar)

- `assets/spritesheet-breakout.png` — hoja de sprites; los rectángulos de corte viven en código, no en el PNG.
- `assets/spritesheet.js` — **archivo JS real, no un build artifact.** Editar a mano.
  - No usa `export`: expone globals (`loadSpritesheet`, `drawFrame`, `drawSprite`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`). Por eso el juego debe cargarlo con `<script src="assets/spritesheet.js">` (script clásico), **no** con `type="module"` ni con un import.
  - Carga la imagen con ruta **relativa al documento**: `rawImg.src = 'assets/spritesheet-breakout.png'`. No cambies esto a una ruta absoluta ni la muevas; el juego espera esa ubicación.
  - `loadSpritesheet( cb )` es asíncrono y encola callbacks: el juego no debe dibujar hasta que se llame el callback (`ssLoaded` es interno, no se exporta).
  - `drawSprite( ctx, name, ... )` solo acepta los nombres de `SPRITES` y el prefijo `block_<color>` para los bloques.
  - `EXPLOSION_FRAMES.gray` tiene las mismas coordenadas que `red` (`sy: 176`): está así en el archivo de origen, no lo "arregles" al vuelo. Si se necesita explosión gris, decidir con el usuario antes de tocarlo.
- `assets/sounds/ball-bounce.mp3`, `break-sound.mp3` — usar con `Audio` de HTML5; no hay assets de música.

## Workflow de specs (skills instaladas en `.agents/skills/`)

`skills-lock.json` fija las skills `spec` y `spec-impl` (origen `Klerith/fernando-skills`). Son el flujo esperado para features grandes:

- **`/spec <descripción>`** — escribe `specs/NN-slug.md` siguiendo `.agents/skills/spec/template.md`, con estado `Draft`. No escribe código nunca, y no propone implementar al final.
- **`/spec-impl <NN-slug>`** — solo continúa si el estado del spec significa "Aprobado" (en cualquier idioma). Crea el branch `spec-NN-slug`, implementa paso a paso **sin commitear nunca**, y al final pide verificar los criterios de aceptación.

En opencode las skills **no** se convierten en slash commands: `/spec` y `/spec-impl` son wrappers en `.opencode/command/spec.md` y `.opencode/command/spec-impl.md` que cargan la skill correspondiente con la herramienta `skill`. En Claude Code las slash commands vienen solas desde `.agents/skills/`.

Detalles a tener en cuenta:
- Los estados y títulos de sección se pueden escribir en español (`Aprobado`, `Alcance`, `Plan de implementación`, `Criterios de aceptación`); las skills los detectan por significado.
- `specs/.spec-config.yml` con `AutoCreateBranch: true|false` controla si `/spec-impl` crea el branch sin preguntar. No existe todavía; se crea sola al primer `/spec`.
- **Las dos skills asumen git y una carpeta `specs/`, y hoy no hay ninguno de los dos.** Si se va a usar el flujo, hay que inicializar git primero; si el usuario no lo pide, no lo inicialices por tu cuenta.

## Referencias

- `.agents/skills/spec/SKILL.md` y `.agents/skills/spec-impl/SKILL.md` — flujo completo; léelos antes de improvisar un proceso propio.
- Los proyectos hermanos del curso (`../02-claude-asteroids`, `../03-claude-tetris`) son la referencia de estructura y estilo cuando haga falta un ejemplo.