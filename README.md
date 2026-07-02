# mypipelines

Catálogo navegable de los pipelines CI/CD de `ci-templates`, por stack.

## Desarrollo

```bash
pnpm install
pnpm sync      # regenera src/content/pipelines/ desde ../ci-templates
pnpm dev
```

`pnpm build` corre el sync y luego `astro build`. El contenido generado se
commitea (Vercel no ve `../ci-templates`). Re-corré `pnpm sync` cuando cambie
`ci-templates`.
