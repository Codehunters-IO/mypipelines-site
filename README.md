# mypipelines

Catálogo navegable de los pipelines CI/CD de [`ci-templates`](../ci-templates),
organizado por stack. Sitio estático construido con Astro y desplegado en Vercel.

## Qué contiene

- **Pipelines** por stack: Java (Spring Boot), KrakenD, React, NGINX,
  Contracts (Hardhat/Solidity) y Shared (cross-cutting).
- **Guías**: quick start, GitFlow, deploy targets.
- **Referencia**: rulesets, CODEOWNERS.
- **Búsqueda** full-text del lado del cliente (Pagefind).

El contenido de `src/content/pipelines/` se **genera** desde `../ci-templates`
vía `scripts/sync-pipelines.mjs`. No se edita a mano.

## Desarrollo

```bash
pnpm install
pnpm sync      # regenera src/content/pipelines/ desde ../ci-templates
pnpm dev       # servidor local con hot reload
```

Otros comandos:

```bash
pnpm build     # sync + astro build (salida en dist/)
pnpm preview   # sirve el build de producción
pnpm check     # astro check (type-check de .astro)
pnpm test      # node --test (tests en tests/)
```

`pnpm build` corre el sync y luego `astro build`. El contenido generado se
commitea porque Vercel no ve `../ci-templates`. Re-corré `pnpm sync` cuando
cambie `ci-templates`.

## Stack técnico

- [Astro](https://astro.build) 6 — output estático
- Tailwind CSS 4
- MDX para el contenido
- Expressive Code — resaltado de sintaxis (temas Dracula / GitHub Light)
- Pagefind — búsqueda estática
- pnpm workspace · Node ≥ 20

## Estructura

```
scripts/sync-pipelines.mjs   # genera content/pipelines desde ../ci-templates
src/
  content/                   # pipelines (generado), gradle, guides, actions
  lib/stacks.ts              # orden y etiquetas de stacks/kinds/types
  pages/                     # rutas: stacks, pipelines, guides, reference, search
  components/ · layouts/     # UI
```

## Deploy

Push a la rama por defecto → Vercel corre `pnpm build` (`vercel.json`).
Sitio en https://mypipelines.vercel.app
