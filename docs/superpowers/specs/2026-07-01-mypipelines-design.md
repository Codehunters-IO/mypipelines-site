# mypipelines — Design (v1)

**Date:** 2026-07-01
**Status:** Approved (brainstorming) — pending spec review

## What this is

Micrositio que expone los CI/CD templates del repo `ci-templates` (GitHub Actions
reusable workflows + consumer templates + branch/tag rulesets) como **catálogo
navegable, copiable y con búsqueda**. Análogo a `cloudehexagonalsite` (que expone
las guidelines de arquitectura hexagonal), pero para pipelines.

**Core value:** un developer JVM/frontend entra, encuentra el pipeline de *su*
stack, copia el caller y arranca en minutos. Pitch **adoption-first**: "copiá tu
pipeline y andá".

**Audiencia:** developers hispanohablantes que consumen la librería `ci-templates`
(equipos Java/Spring, Krakend, React, NGINX, Contracts).

## Constraints

- **Ubicación:** `codehunters/mypipelines` (hermano de `cloudehexagonalsite` y
  `ci-templates`). Repo git propio.
- **Stack:** reutiliza el scaffold probado de `cloudehexagonalsite` — decisión
  cerrada. Astro 6.4.4 + MDX + Tailwind v4 (`@tailwindcss/vite`) +
  `astro-expressive-code` + `astro-pagefind` + Vercel static. Tema light/dark.
- **Fuente de contenido:** `../ci-templates` es read-only desde el sitio. Toda
  edición sigue en el repo `ci-templates`.
- **Vendoring:** contenido generado se **commitea** a `mypipelines`. Vercel solo
  lee lo commiteado (no tiene acceso al repo hermano — misma restricción que
  guidelines→cloudehexagonalsite). Re-sync manual cuando `ci-templates` cambie.
- **i18n:** ES-only en v1 (los workflows son código language-neutral). EN → v2.
- **Sin backend:** 100% static. No auth, no comments, no DB.
- **Deploy:** Vercel free tier, subdominio `.vercel.app`, preview por PR.

## Architecture

Site static Astro reutilizando el scaffold de `cloudehexagonalsite`:

| Capa | Tech | Notas |
|------|------|-------|
| Framework | Astro 6.4.4 static | `output: 'static'` |
| Contenido | Content collections v2 (glob loader) | colecciones `workflows`, `templates`, `rulesets`, `guides` |
| Markdown/MDX | `@astrojs/mdx` 6.0.2 | páginas de explainers |
| Syntax highlight | `astro-expressive-code` 0.42.0 | **YAML** + copy-button (clave para copy-paste); declarar ANTES de `mdx()` |
| Search | `astro-pagefind` 2.0.0 + `pagefind` 1.5.2 | postbuild index sobre `dist/` |
| Estilos | Tailwind v4.3 + `@tailwindcss/typography` | CSS-first config |
| Deploy | `@astrojs/vercel` 10.0.8 | static |
| Lint/format | Prettier + `prettier-plugin-astro`, Biome, `@astrojs/check` | igual que cloudehexagonalsite |

## Content model & sync

`scripts/sync-pipelines.mjs` (corre en `prebuild`, también manual):

1. Lee `../ci-templates/.github/workflows/*.yml`,
   `../ci-templates/templates/*.yml`, `../ci-templates/.github/ruleset/*.json`,
   `../ci-templates/.github/CODEOWNERS`.
2. Deriva metadata por archivo: `stack` (java/krakend/react/nginx/contracts/shared),
   `type` (build/test/security/artifact/deploy/notify/release/pipeline/caller/ruleset),
   `triggers`, `description` (del header comment del YAML), `usedBy`/`uses`
   (cross-refs vía `uses:` y `needs:`).
3. Genera `src/content/<collection>/<slug>.mdx` con ese frontmatter + el YAML/JSON
   crudo embebido en un bloque Expressive Code.
4. Emite WARN por archivos sin clasificar (patrón sync-guides.mjs).

Contenido generado se commitea. `GUIDE_MAP`-equivalente: un `PIPELINE_MAP` o
derivación por convención de nombre (`<stack>-<rest>.yml`).

**Nota de fidelidad:** el YAML se embebe verbatim (fuente de verdad = repo). Los
explainers curados son las ÚNICAS páginas escritas a mano.

## Information Architecture

Navegación **por stack** (eje primario):

```
/                       landing — pitch 30s + Quick Start + grid de stacks
/stacks/java            workflows + templates de Java (build/test/sec/artifact/deploy)
/stacks/krakend
/stacks/react
/stacks/nginx
/stacks/contracts
/stacks/shared          cross-cutting reusable workflows (semver, notify, release, ...)
/reference/rulesets     branch/tag protection JSON + CODEOWNERS
/guides/gitflow         explainer: modelo GitFlow → pipeline
/guides/quick-start     explainer: adopción (copiar caller, reemplazar <org>, secrets)
/guides/deploy-targets  explainer: ec2 / ec2-vpn (WireGuard) / eks / s3
/guides/security-gates  explainer: dependency-review, trufflehog, owasp, sonar/qodana
/search                 Pagefind
```

**Página de workflow/template (unidad de catálogo):**
- Título + stack badge + type badge
- Descripción (del header comment)
- Triggers (push/PR/branches)
- Inputs / secrets requeridos (tabla)
- YAML crudo con copy-button (Expressive Code)
- Cross-links: "usa" (reusable workflows que invoca) / "usado por" (callers)

**Explainers curados:** reutilizan lo ya destilado en `~/.claude/guidelines/
github-actions.md` y `git-workflow.md` (GitFlow, Quick Start, deploy targets,
security gates). No duplicar el YAML — enlazar a las páginas de catálogo.

## Units / boundaries

- `sync-pipelines.mjs` — único punto de acoplamiento con `ci-templates`. Entrada:
  filesystem de `../ci-templates`. Salida: `src/content/*`. Testeable con un
  fixture de YAMLs.
- Content collections schema (Zod) — contrato de frontmatter; falla el build si
  el sync emite metadata inválida.
- Layouts/components — presentación pura; consumen collections, no tocan el sync.
- Explainers MDX — contenido humano; independientes del sync.

## Testing

- Sync script: unit test con fixture de 2-3 YAMLs → assert frontmatter derivado
  (stack, type, triggers) + slug.
- `astro check` en CI (0 errores).
- Build gate local: `pnpm build` + `pnpm preview` + curl antes de push a Vercel
  (mismo gate que cloudehexagonalsite).
- Pagefind index generado postbuild (verificar que indexa todas las páginas).

## Out of scope (v1)

- **Jenkins fallback** (CasC + declarative pipelines + Jenkinsfiles) → v2.
- Fetch dinámico / git submodule de ci-templates → v1 usa vendoring commiteado.
- i18n bilingual EN → v2.
- OG images, sitemap avanzado → v2.
- Runtime search backend → Pagefind static es suficiente.

## Open questions

Ninguna bloqueante. Decisiones tomadas: navegación por stack, vendoring
commiteado, ES-only, pitch adoption-first, Jenkins fuera de v1.
