---
description: Carga la skill `spec` y guia el diseño de una spec (spec-driven development).
---

Carga la skill `spec` con la herramienta `skill` (`skill({ name: "spec" })`) y sigue sus
instrucciones al pie de la letra, sin resumirlas ni improvisar el flujo.

Contexto de sesión:

Fecha de hoy — obtén la fecha real con la herramienta bash (`Get-Date -Format yyyy-MM-dd` en
PowerShell, `date +%F` en bash) y nunca la adivines ni la inventes.

Specs existentes:
!`dir specs`

Plantilla de la spec: @.agents/skills/spec/template.md

Entrada del usuario: $ARGUMENTS