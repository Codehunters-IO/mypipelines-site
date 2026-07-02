# mypipelines v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a static Astro site that exposes the `ci-templates` CI/CD library as a stack-navigable, copy-pasteable, searchable catalog.

**Architecture:** Clone the proven `cloudehexagonalsite` Astro scaffold (Astro static + MDX + Tailwind v4 + Expressive Code + Pagefind + Vercel). A `sync-pipelines.mjs` prebuild script reads `../ci-templates`, derives per-file metadata (stack/kind/type/triggers/description), and writes vendored `src/content/pipelines/*.mdx` (frontmatter + embedded raw YAML/JSON). Presentation is stack-first: `/stacks/<stack>` index pages + `/pipelines/<slug>` detail pages + hand-written `/guides/*` explainers.

**Tech Stack:** Astro 6.4.7, `@astrojs/mdx` 6.0.2, `astro-expressive-code` 0.43.1, `astro-pagefind` 2.0.0 + `pagefind` 1.5.2, Tailwind v4.3 (`@tailwindcss/vite`), `@astrojs/check` 0.9.9, TypeScript 5.8, pnpm 11, Node ≥20.

## Global Constraints

- **Repo location:** `codehunters/mypipelines` (sibling of `cloudehexagonalsite` and `ci-templates`). Its own git repo.
- **Content source:** `../ci-templates` is read-only. Never edit files there from this project.
- **Vendoring:** generated content is committed to `src/content/pipelines/`. Vercel only reads committed files — the sync script MUST `exit 0` (never `exit 1`) when the source dir is absent (Vercel CI has no sibling repo).
- **Source-dir resolution:** resolve `../ci-templates` relative to the repo root via `process.cwd()` + `..`, never a hardcoded absolute path (iCloud path has spaces).
- **i18n:** ES-only in v1. No `/en/` routes. UI copy in Spanish.
- **No new runtime deps:** parse YAML with line-scanning, not a YAML library. Dep set matches `cloudehexagonalsite` exactly.
- **Stacks (locked enum):** `java`, `krakend`, `react`, `nginx`, `contracts`, `shared`. Must match across `content.config.ts`, `lib/stacks.ts`, and `sync-pipelines.mjs`.
- **Kinds (locked enum):** `reusable`, `caller`, `ruleset`, `codeowners`.
- **Frontmatter description:** max 200 chars (Zod-enforced).
- **Build gate:** `pnpm build` + `pnpm preview` + curl a route before any Vercel push.
- **Commits:** Conventional Commits. Frequent, atomic.

---

## File Structure

```
mypipelines/
├── package.json                       # adapted from cloudehexagonalsite
├── astro.config.mjs                   # ES-only i18n, EC before mdx, pagefind
├── tsconfig.json
├── .gitignore
├── scripts/
│   └── sync-pipelines.mjs             # NOVEL — parser + generator
├── tests/
│   └── sync-pipelines.test.mjs        # node:test unit tests
├── tests/fixtures/ci-templates/       # mini fixture repo for sync tests
│   ├── .github/workflows/java-build.yml
│   ├── .github/ruleset/ruleset-main.json
│   ├── .github/CODEOWNERS
│   └── templates/java-main-deploy.yml
├── src/
│   ├── content.config.ts              # pipelines + guides collections
│   ├── lib/
│   │   └── stacks.ts                   # STACK_ORDER + labels + TYPE labels
│   ├── i18n/ui.ts                      # ES strings
│   ├── layouts/BaseLayout.astro        # copied + de-i18n'd
│   ├── components/                     # copied subset (Header, Footer, ThemeToggle, SearchModal, Breadcrumb, ToC, PipelineCard)
│   ├── styles/global.css               # copied verbatim
│   ├── content/
│   │   ├── pipelines/                  # GENERATED (committed)
│   │   └── guides/                     # hand-written MDX explainers
│   └── pages/
│       ├── index.astro                 # landing
│       ├── stacks/[stack].astro        # per-stack catalog
│       ├── pipelines/[slug].astro      # detail page
│       ├── reference/rulesets.astro    # rulesets + CODEOWNERS
│       ├── guides/[slug].astro         # explainer renderer
│       └── search.astro
```

---

## Task 1: Scaffold the project from the cloudehexagonalsite skeleton

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `src/styles/global.css`
- Create (copied): `src/layouts/BaseLayout.astro`, `src/components/{Header,Footer,ThemeToggle,SearchModal,Breadcrumb,ToC}.astro`, `src/i18n/ui.ts`

**Interfaces:**
- Produces: a bootable Astro project (`pnpm dev` serves an empty-but-valid site; `pnpm check` exits 0).

- [ ] **Step 1: Copy the scaffold files from the sibling site**

Run from `mypipelines/`:
```bash
SRC="../cloudehexagonalsite"
mkdir -p src/layouts src/components src/styles src/i18n scripts
cp "$SRC/tsconfig.json" tsconfig.json
cp "$SRC/src/styles/global.css" src/styles/global.css
cp "$SRC/src/layouts/BaseLayout.astro" src/layouts/BaseLayout.astro
cp "$SRC/src/components/Header.astro"      src/components/
cp "$SRC/src/components/Footer.astro"      src/components/
cp "$SRC/src/components/ThemeToggle.astro" src/components/
cp "$SRC/src/components/SearchModal.astro" src/components/
cp "$SRC/src/components/Breadcrumb.astro"  src/components/
cp "$SRC/src/components/ToC.astro"         src/components/
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "mypipelines",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "packageManager": "pnpm@11.5.1",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/sync-pipelines.mjs && astro build",
    "preview": "astro preview",
    "sync": "node scripts/sync-pipelines.mjs",
    "test": "node --test",
    "astro": "astro",
    "check": "astro check"
  },
  "dependencies": {
    "@astrojs/mdx": "6.0.2",
    "@expressive-code/plugin-line-numbers": "0.43.1",
    "@fontsource-variable/ibm-plex-sans": "^5.2.8",
    "@fontsource-variable/jetbrains-mono": "^5.2.8",
    "@tailwindcss/typography": "0.5.20",
    "@tailwindcss/vite": "4.3.0",
    "astro": "6.4.7",
    "astro-expressive-code": "0.43.1",
    "tailwindcss": "4.3.0"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.9",
    "astro-pagefind": "2.0.0",
    "pagefind": "1.5.2",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 3: Write `astro.config.mjs` (ES-only, EC before mdx)**

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import pagefind from 'astro-pagefind';

export default defineConfig({
  output: 'static',
  site: 'https://mypipelines.vercel.app',
  integrations: [
    expressiveCode({
      themes: ['dracula', 'github-light'],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => {
        if (theme.name === 'dracula') return 'html.dark';
        if (theme.name === 'github-light') return 'html:not(.dark)';
        return false;
      },
      plugins: [pluginLineNumbers()],
      defaultProps: {
        showLineNumbers: false,
        overridesByLang: { 'bash,sh,zsh': { showLineNumbers: false, wrap: false } },
      },
    }),
    mdx(),
    pagefind(),
  ],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules/
dist/
.astro/
.vercel/
.DS_Store
*.local
```

- [ ] **Step 5: Strip i18n from BaseLayout + copied components**

The copied `BaseLayout.astro` and components accept a `lang` prop and call `t(lang, ...)`. For v1 ES-only, keep the `lang` prop threading (default `'es'`) but the new `src/i18n/ui.ts` (next step) only defines `es`. Open each copied file; where a component imports `getRelativeLocaleUrl` or renders `LangSwitcher`/`HreflangTags`, remove that import and usage. Do NOT copy `LangSwitcher.astro` or `HreflangTags.astro`.

Verify no remaining reference:
```bash
grep -rn "LangSwitcher\|HreflangTags\|getRelativeLocaleUrl\|/en/" src/ || echo "clean"
```
Expected: `clean`

- [ ] **Step 6: Write `src/i18n/ui.ts` (ES-only)**

```ts
export const defaultLocale = 'es' as const;

const strings = {
  'site.title': 'mypipelines',
  'site.tagline': 'Pipelines CI/CD listos para copiar',
  'nav.stacks': 'Stacks',
  'nav.guides': 'Guías',
  'nav.reference': 'Referencia',
  'nav.search': 'Buscar',
  'catalog.title': 'Catálogo de pipelines',
  'catalog.subtitle': 'Workflows reutilizables y templates por stack',
  'footer.source': 'Contenido generado desde el repositorio ci-templates',
} as const;

export type UiKey = keyof typeof strings;

export function t(_lang: string, key: UiKey): string {
  return strings[key] ?? key;
}
```

- [ ] **Step 7: Install and verify the scaffold boots**

```bash
pnpm install
pnpm check
```
Expected: `astro check` completes with 0 errors (hints allowed). If a copied component still references a removed i18n symbol, fix per Step 5.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold mypipelines from cloudehexagonalsite skeleton"
```

---

## Task 2: Content schema (pipelines + guides collections)

**Files:**
- Create: `src/content.config.ts`
- Create: `src/lib/stacks.ts`

**Interfaces:**
- Produces: `pipelines` collection schema with fields `{ title: string, slug: string, stack: Stack, kind: Kind, type: string, triggers: string[], description: string, sourcePath: string }`; `guides` collection `{ title, slug, order, description }`.
- Produces: `STACK_ORDER: readonly Stack[]`, `STACK_LABELS: Record<Stack,string>`, `TYPE_LABELS: Record<string,string>`.

- [ ] **Step 1: Write `src/lib/stacks.ts`**

```ts
export const STACK_ORDER = ['java', 'krakend', 'react', 'nginx', 'contracts', 'shared'] as const;
export type Stack = (typeof STACK_ORDER)[number];

export const STACK_LABELS: Record<Stack, string> = {
  java: 'Java (Spring Boot)',
  krakend: 'KrakenD',
  react: 'React',
  nginx: 'NGINX',
  contracts: 'Contracts (Hardhat/Solidity)',
  shared: 'Shared (cross-cutting)',
};

export const KIND_ORDER = ['reusable', 'caller', 'ruleset', 'codeowners'] as const;
export type Kind = (typeof KIND_ORDER)[number];

export const KIND_LABELS: Record<Kind, string> = {
  reusable: 'Reusable workflow',
  caller: 'Consumer template',
  ruleset: 'Ruleset',
  codeowners: 'CODEOWNERS',
};

// type = coarse functional group derived from the filename
export const TYPE_LABELS: Record<string, string> = {
  build: 'Build', test: 'Test', security: 'Security', artifact: 'Artifact',
  deploy: 'Deploy', notify: 'Notifications', release: 'Release',
  pipeline: 'Pipeline', lint: 'Lint', misc: 'Misc',
};
```

- [ ] **Step 2: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { STACK_ORDER, KIND_ORDER } from './lib/stacks';

const pipelines = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pipelines' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    stack: z.enum(STACK_ORDER),
    kind: z.enum(KIND_ORDER),
    type: z.string(),
    triggers: z.array(z.string()),
    description: z.string().max(200),
    sourcePath: z.string(),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number().int().min(1),
    description: z.string().max(200),
  }),
});

export const collections = { pipelines, guides };
```

- [ ] **Step 3: Create a placeholder guide so `astro check` has content to validate**

Create `src/content/guides/quick-start.mdx`:
```mdx
---
title: "Quick Start"
slug: "quick-start"
order: 1
description: "Cómo adoptar los pipelines en tu repositorio en minutos."
---

# Quick Start

Contenido pendiente (Task 8).
```

- [ ] **Step 4: Verify schema compiles**

```bash
pnpm check
```
Expected: 0 errors. (The `pipelines` collection is empty — valid.)

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/lib/stacks.ts src/content/guides/quick-start.mdx
git commit -m "feat: pipelines + guides content collections and stack enums"
```

---

## Task 3: sync-pipelines.mjs — metadata derivation (pure functions, TDD)

**Files:**
- Create: `scripts/sync-pipelines.mjs` (pure helpers + guarded main)
- Create: `tests/sync-pipelines.test.mjs`

**Interfaces:**
- Produces (named exports, no fs side-effects on import):
  - `deriveStack(relPath: string): Stack` — filename prefix before first `-`; `security` → `shared`; ruleset/CODEOWNERS → `shared`.
  - `deriveKind(relPath: string): Kind` — path under `.github/workflows/` → `reusable`; `templates/` → `caller`; `.github/ruleset/` → `ruleset`; `CODEOWNERS` → `codeowners`.
  - `deriveType(relPath: string): string` — keyword scan of filename → one of `TYPE_LABELS` keys; default `misc`.
  - `extractDescription(raw: string): string` — leading `#` comment block joined; else the `name:` value; else `''`. Trimmed to ≤200 chars.
  - `extractTriggers(raw: string): string[]` — top-level keys under `on:` (`push`, `pull_request`, `workflow_call`, …); `[]` for non-workflow files.
  - `toSlug(relPath: string): string` — basename without extension.

- [ ] **Step 1: Write the failing tests**

`tests/sync-pipelines.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveStack, deriveKind, deriveType, extractDescription, extractTriggers, toSlug,
} from '../scripts/sync-pipelines.mjs';

test('deriveStack from filename prefix', () => {
  assert.equal(deriveStack('.github/workflows/java-build.yml'), 'java');
  assert.equal(deriveStack('templates/krakend-main-deploy.yml'), 'krakend');
  assert.equal(deriveStack('.github/workflows/security-trufflehog.yml'), 'shared');
  assert.equal(deriveStack('.github/ruleset/ruleset-main.json'), 'shared');
  assert.equal(deriveStack('.github/CODEOWNERS'), 'shared');
});

test('deriveKind from path', () => {
  assert.equal(deriveKind('.github/workflows/java-build.yml'), 'reusable');
  assert.equal(deriveKind('templates/java-main-deploy.yml'), 'caller');
  assert.equal(deriveKind('.github/ruleset/ruleset-main.json'), 'ruleset');
  assert.equal(deriveKind('.github/CODEOWNERS'), 'codeowners');
});

test('deriveType keyword scan', () => {
  assert.equal(deriveType('java-build.yml'), 'build');
  assert.equal(deriveType('java-owasp.yml'), 'security');
  assert.equal(deriveType('security-trufflehog.yml'), 'security');
  assert.equal(deriveType('java-artifact-docker-ecr.yml'), 'artifact');
  assert.equal(deriveType('shared-deploy-eks.yml'), 'deploy');
  assert.equal(deriveType('shared-slack-notify.yml'), 'notify');
  assert.equal(deriveType('java-main-pipeline.yml'), 'pipeline');
  assert.equal(deriveType('shared-release.yml'), 'release');
  assert.equal(deriveType('java-commit-lint.yml'), 'lint');
  assert.equal(deriveType('mystery.yml'), 'misc');
});

test('extractDescription prefers leading comment block', () => {
  const raw = '# Template: Deploy on merge to main\n# Runs build + deploy\n\nname: Deploy to Production\non:\n  push:\n';
  assert.equal(extractDescription(raw), 'Template: Deploy on merge to main Runs build + deploy');
});

test('extractDescription falls back to name field', () => {
  const raw = 'name: Java - Build\non:\n  workflow_call:\n';
  assert.equal(extractDescription(raw), 'Java - Build');
});

test('extractTriggers reads top-level on: keys', () => {
  const raw = 'name: x\non:\n  push:\n    branches: [main]\n  pull_request:\n  workflow_call:\n';
  assert.deepEqual(extractTriggers(raw), ['push', 'pull_request', 'workflow_call']);
});

test('extractTriggers empty for non-workflow', () => {
  assert.deepEqual(extractTriggers('{ "name": "ruleset" }'), []);
});

test('toSlug strips dir and extension', () => {
  assert.equal(toSlug('.github/workflows/java-build.yml'), 'java-build');
  assert.equal(toSlug('.github/CODEOWNERS'), 'CODEOWNERS');
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `pnpm test`
Expected: FAIL — `Cannot find module` / exports undefined.

- [ ] **Step 3: Implement the pure helpers**

Create `scripts/sync-pipelines.mjs` (helpers only for now; main block added in Task 4):
```js
#!/usr/bin/env node
import { basename, extname } from 'node:path';

const STACKS = ['java', 'krakend', 'react', 'nginx', 'contracts', 'shared'];

export function toSlug(relPath) {
  const base = basename(relPath);
  const ext = extname(base);
  return ext ? base.slice(0, -ext.length) : base;
}

export function deriveStack(relPath) {
  const base = basename(relPath);
  if (base === 'CODEOWNERS') return 'shared';
  if (base.startsWith('ruleset')) return 'shared';
  const prefix = base.split('-')[0].replace(/\..*$/, '');
  if (prefix === 'security') return 'shared';
  return STACKS.includes(prefix) ? prefix : 'shared';
}

export function deriveKind(relPath) {
  if (relPath.endsWith('CODEOWNERS')) return 'codeowners';
  if (relPath.includes('/ruleset/')) return 'ruleset';
  if (relPath.includes('templates/')) return 'caller';
  if (relPath.includes('.github/workflows/')) return 'reusable';
  return 'reusable';
}

const TYPE_KEYWORDS = [
  ['artifact', 'artifact'], ['owasp', 'security'], ['trufflehog', 'security'],
  ['qodana', 'security'], ['dependency-review', 'security'], ['security', 'security'],
  ['deploy', 'deploy'], ['notif', 'notify'], ['slack', 'notify'],
  ['pipeline', 'pipeline'], ['release', 'release'], ['tag', 'release'],
  ['semver', 'release'], ['commit-lint', 'lint'], ['validate-source', 'lint'],
  ['test', 'test'], ['build', 'build'], ['architecture', 'test'],
];

export function deriveType(relPath) {
  const base = basename(relPath).toLowerCase();
  for (const [kw, type] of TYPE_KEYWORDS) if (base.includes(kw)) return type;
  return 'misc';
}

export function extractDescription(raw) {
  const lines = raw.split('\n');
  const comments = [];
  for (const line of lines) {
    if (/^\s*#/.test(line)) comments.push(line.replace(/^\s*#\s?/, '').trim());
    else if (comments.length) break;
    else if (line.trim() === '') continue;
    else break;
  }
  let desc = comments.filter(Boolean).join(' ').trim();
  if (!desc) {
    const nameMatch = raw.match(/^name:\s*(.+)$/m);
    desc = nameMatch ? nameMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
  }
  return desc.slice(0, 200);
}

export function extractTriggers(raw) {
  const lines = raw.split('\n');
  const onIdx = lines.findIndex((l) => /^on:\s*$/.test(l) || /^on:\s*\S/.test(l));
  if (onIdx === -1) return [];
  const triggers = [];
  for (let i = onIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break;                       // dedent to col 0 → end of on:
    const m = line.match(/^  ([a-z_]+):/);             // exactly 2-space indent key
    if (m) triggers.push(m[1]);
  }
  return triggers;
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `pnpm test`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/sync-pipelines.mjs tests/sync-pipelines.test.mjs
git commit -m "feat: sync-pipelines metadata derivation helpers with tests"
```

---

## Task 4: sync-pipelines.mjs — file generation (reads ci-templates, writes vendored MDX)

**Files:**
- Modify: `scripts/sync-pipelines.mjs` (add guarded main block + `generate()` + `collectSources()`)
- Create: `tests/fixtures/ci-templates/.github/workflows/java-build.yml`
- Create: `tests/fixtures/ci-templates/templates/java-main-deploy.yml`
- Create: `tests/fixtures/ci-templates/.github/ruleset/ruleset-main.json`
- Create: `tests/fixtures/ci-templates/.github/CODEOWNERS`
- Modify: `tests/sync-pipelines.test.mjs` (add `generate()` test against the fixture)

**Interfaces:**
- Consumes: helpers from Task 3.
- Produces: `collectSources(rootDir): {relPath, lang}[]` and `generate(rootDir, destDir): number` (returns count written). `lang` is `yaml` for `.yml`, `json` for `.json`, `text` for CODEOWNERS. Main block: resolves `SOURCE_DIR = join(cwd, '..', 'ci-templates')`; if absent → warn + `exit 0`; else `generate()` into `src/content/pipelines`.

- [ ] **Step 1: Create the fixture files**

`tests/fixtures/ci-templates/.github/workflows/java-build.yml`:
```yaml
name: Java - Build
on:
  workflow_call:
    inputs:
      java_version:
        type: string
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: ./gradlew build
```

`tests/fixtures/ci-templates/templates/java-main-deploy.yml`:
```yaml
# Template: Deploy on merge to main (production)
# Runs build + artifact + deploy
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  pipeline:
    uses: <org>/ci-templates/.github/workflows/java-main-pipeline.yml@main
```

`tests/fixtures/ci-templates/.github/ruleset/ruleset-main.json`:
```json
{ "name": "Protect main", "target": "branch", "enforcement": "active" }
```

`tests/fixtures/ci-templates/.github/CODEOWNERS`:
```
* @platform-team
```

- [ ] **Step 2: Write the failing generation test**

Append to `tests/sync-pipelines.test.mjs`:
```js
import { generate, collectSources } from '../scripts/sync-pipelines.mjs';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('collectSources finds workflows, templates, rulesets, CODEOWNERS', () => {
  const root = 'tests/fixtures/ci-templates';
  const rels = collectSources(root).map((s) => s.relPath).sort();
  assert.deepEqual(rels, [
    '.github/CODEOWNERS',
    '.github/ruleset/ruleset-main.json',
    '.github/workflows/java-build.yml',
    'templates/java-main-deploy.yml',
  ]);
});

test('generate writes one mdx per source with valid frontmatter', () => {
  const dest = mkdtempSync(join(tmpdir(), 'mp-'));
  const count = generate('tests/fixtures/ci-templates', dest);
  assert.equal(count, 4);
  const files = readdirSync(dest).sort();
  assert.deepEqual(files, ['CODEOWNERS.mdx', 'java-build.mdx', 'java-main-deploy.mdx', 'ruleset-main.mdx']);
  const build = readFileSync(join(dest, 'java-build.mdx'), 'utf8');
  assert.match(build, /stack: "java"/);
  assert.match(build, /kind: "reusable"/);
  assert.match(build, /type: "build"/);
  assert.match(build, /```yaml/);
  assert.match(build, /\.\/gradlew build/);
  const deploy = readFileSync(join(dest, 'java-main-deploy.mdx'), 'utf8');
  assert.match(deploy, /kind: "caller"/);
  assert.match(deploy, /triggers: \["push"\]/);
  rmSync(dest, { recursive: true, force: true });
});
```

- [ ] **Step 3: Run tests, verify the new ones fail**

Run: `pnpm test`
Expected: FAIL — `generate`/`collectSources` undefined. (The 8 helper tests still pass.)

- [ ] **Step 4: Implement `collectSources`, `generate`, and the guarded main block**

Append to `scripts/sync-pipelines.mjs`:
```js
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const SUBTREES = ['.github/workflows', 'templates', '.github/ruleset'];

function langFor(relPath) {
  if (relPath.endsWith('.json')) return 'json';
  if (relPath.endsWith('.yml') || relPath.endsWith('.yaml')) return 'yaml';
  return 'text';
}

export function collectSources(rootDir) {
  const out = [];
  for (const sub of SUBTREES) {
    const dir = join(rootDir, sub);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.startsWith('.')) continue;
      const relPath = `${sub}/${f}`;
      out.push({ relPath, lang: langFor(relPath) });
    }
  }
  const codeowners = join(rootDir, '.github', 'CODEOWNERS');
  if (existsSync(codeowners)) out.push({ relPath: '.github/CODEOWNERS', lang: 'text' });
  return out;
}

function titleFor(slug, kind) {
  if (kind === 'codeowners') return 'CODEOWNERS';
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generate(rootDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  const sources = collectSources(rootDir);
  for (const { relPath, lang } of sources) {
    const raw = readFileSync(join(rootDir, relPath), 'utf8');
    const slug = toSlug(relPath);
    const stack = deriveStack(relPath);
    const kind = deriveKind(relPath);
    const type = deriveType(relPath);
    const triggers = extractTriggers(raw);
    const description = extractDescription(raw) || `${kind} ${slug}`;
    const fm = [
      '---',
      `title: ${JSON.stringify(titleFor(slug, kind))}`,
      `slug: "${slug}"`,
      `stack: "${stack}"`,
      `kind: "${kind}"`,
      `type: "${type}"`,
      `triggers: ${JSON.stringify(triggers)}`,
      `description: ${JSON.stringify(description.slice(0, 200))}`,
      `sourcePath: ${JSON.stringify(relPath)}`,
      '---',
      '',
      `\`\`\`${lang} title="${relPath}"`,
      raw.replace(/\n$/, ''),
      '```',
      '',
    ].join('\n');
    writeFileSync(join(destDir, `${slug}.mdx`), fm, 'utf8');
  }
  return sources.length;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const SOURCE_DIR = join(process.cwd(), '..', 'ci-templates');
  const DEST_DIR = join(process.cwd(), 'src', 'content', 'pipelines');
  if (!existsSync(SOURCE_DIR)) {
    console.warn(`[sync-pipelines] Source dir not found: ${SOURCE_DIR}`);
    console.warn('[sync-pipelines] Skipping sync — using committed files.');
    process.exit(0);
  }
  const n = generate(SOURCE_DIR, DEST_DIR);
  console.log(`[sync-pipelines] Done — ${n} pipelines synced to ${DEST_DIR}`);
}
```

- [ ] **Step 5: Run tests, verify all pass**

Run: `pnpm test`
Expected: PASS — 10 tests.

- [ ] **Step 6: Run the real sync against ../ci-templates and verify**

```bash
pnpm sync
ls src/content/pipelines/ | head
pnpm check
```
Expected: dozens of `.mdx` files generated; `astro check` 0 errors (schema validates every generated file). If a generated file fails schema (e.g. description >200 or unknown stack), fix the derivation and re-run.

- [ ] **Step 7: Commit (including generated content — vendoring)**

```bash
git add scripts/sync-pipelines.mjs tests/ src/content/pipelines/
git commit -m "feat: sync-pipelines generation + vendored pipeline catalog"
```

---

## Task 5: Stack index pages (`/stacks/[stack]`)

**Files:**
- Create: `src/pages/stacks/[stack].astro`
- Create: `src/components/PipelineCard.astro`

**Interfaces:**
- Consumes: `pipelines` collection; `STACK_ORDER`, `STACK_LABELS`, `KIND_LABELS`, `TYPE_LABELS` from `lib/stacks.ts`.
- Produces: one static page per stack, grouping that stack's pipelines by `kind` then `type`.

- [ ] **Step 1: Write `src/components/PipelineCard.astro`**

```astro
---
import { KIND_LABELS, TYPE_LABELS } from '../lib/stacks';
const { entry } = Astro.props;
const d = entry.data;
---
<a href={`/pipelines/${d.slug}`}
   class="block rounded-lg border border-[var(--border-subtle)] surface p-4 hover:border-brand-500 transition-colors">
  <div class="flex items-center gap-2 mb-1">
    <span class="text-xs font-mono text-[var(--fg-muted)]">{KIND_LABELS[d.kind]}</span>
    <span class="text-xs rounded bg-brand-500/10 px-1.5 py-0.5 text-brand-600 dark:text-brand-400">{TYPE_LABELS[d.type] ?? d.type}</span>
  </div>
  <h3 class="font-semibold text-[var(--fg)]">{d.title}</h3>
  <p class="mt-1 text-sm text-[var(--fg-muted)] line-clamp-2">{d.description}</p>
</a>
```

- [ ] **Step 2: Write `src/pages/stacks/[stack].astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import PipelineCard from '../../components/PipelineCard.astro';
import { STACK_ORDER, STACK_LABELS, KIND_ORDER, KIND_LABELS } from '../../lib/stacks';
import { defaultLocale } from '../../i18n/ui';

export async function getStaticPaths() {
  return STACK_ORDER.map((stack) => ({ params: { stack } }));
}

const { stack } = Astro.params;
const all = await getCollection('pipelines');
const items = all
  .filter((e) => e.data.stack === stack)
  .sort((a, b) => a.data.slug.localeCompare(b.data.slug));
const byKind = KIND_ORDER.map((kind) => ({ kind, list: items.filter((e) => e.data.kind === kind) }))
  .filter((g) => g.list.length > 0);
const lang = defaultLocale;
---
<BaseLayout title={STACK_LABELS[stack]} lang={lang}>
  <main class="mx-auto max-w-7xl px-4 py-10">
    <h1 class="text-fluid-h1 font-bold tracking-tight text-[var(--fg)]">{STACK_LABELS[stack]}</h1>
    <p class="mt-2 text-[var(--fg-muted)]">{items.length} pipelines</p>
    {byKind.map(({ kind, list }) => (
      <section class="mt-8">
        <h2 class="mb-4 text-2xl font-bold text-[var(--fg)]">{KIND_LABELS[kind]}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((entry) => <PipelineCard entry={entry} />)}
        </div>
      </section>
    ))}
  </main>
</BaseLayout>
```

- [ ] **Step 3: Verify build renders all stack pages**

```bash
pnpm check && pnpm build
```
Expected: 0 errors; build output lists `/stacks/java`, `/stacks/krakend`, … `/stacks/shared`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/stacks/ src/components/PipelineCard.astro
git commit -m "feat: per-stack catalog pages"
```

---

## Task 6: Pipeline detail page (`/pipelines/[slug]`)

**Files:**
- Create: `src/pages/pipelines/[slug].astro`

**Interfaces:**
- Consumes: `pipelines` collection; `render()` from `astro:content`; `STACK_LABELS`, `KIND_LABELS`.
- Produces: one detail page per pipeline entry — renders the embedded code fence (Expressive Code copy-button), metadata header, triggers, and cross-links to callers/reusables sharing the stack.

- [ ] **Step 1: Write `src/pages/pipelines/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Breadcrumb from '../../components/Breadcrumb.astro';
import { STACK_LABELS, KIND_LABELS } from '../../lib/stacks';
import { defaultLocale } from '../../i18n/ui';

export async function getStaticPaths() {
  const entries = await getCollection('pipelines');
  return entries.map((entry) => ({ params: { slug: entry.data.slug }, props: { entry } }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
const d = entry.data;
const lang = defaultLocale;
---
<BaseLayout title={d.title} lang={lang}>
  <Breadcrumb category={d.stack} title={d.title} lang={lang} />
  <main class="mx-auto max-w-4xl px-4 py-8" data-pagefind-body>
    <header class="mb-6 border-b border-[var(--border-subtle)] pb-4">
      <div class="flex flex-wrap gap-2 text-xs text-[var(--fg-muted)]">
        <span>{STACK_LABELS[d.stack]}</span><span>·</span>
        <span>{KIND_LABELS[d.kind]}</span>
        {d.triggers.length > 0 && (<><span>·</span><span>on: {d.triggers.join(', ')}</span></>)}
      </div>
      <h1 class="mt-2 text-3xl font-bold tracking-tight text-[var(--fg)]">{d.title}</h1>
      <p class="mt-2 text-[var(--fg-muted)]">{d.description}</p>
      <p class="mt-1 text-xs font-mono text-[var(--fg-muted)]">{d.sourcePath}</p>
    </header>
    <article class="prose prose-slate dark:prose-invert max-w-none">
      <Content />
    </article>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Verify detail pages build**

```bash
pnpm check && pnpm build
```
Expected: 0 errors; one `/pipelines/<slug>` page per generated entry; the YAML renders with a copy button.

- [ ] **Step 3: Commit**

```bash
git add src/pages/pipelines/
git commit -m "feat: pipeline detail pages with embedded source + copy button"
```

---

## Task 7: Landing page (`/`)

**Files:**
- Create: `src/pages/index.astro`

**Interfaces:**
- Consumes: `pipelines` collection (for per-stack counts); `STACK_ORDER`, `STACK_LABELS`.
- Produces: landing with a 30-second pitch, a Quick Start snippet (copy caller → replace `<org>`), and a stack grid linking to `/stacks/<stack>`.

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import { STACK_ORDER, STACK_LABELS } from '../lib/stacks';
import { defaultLocale, t } from '../i18n/ui';

const lang = defaultLocale;
const all = await getCollection('pipelines');
const counts = Object.fromEntries(
  STACK_ORDER.map((s) => [s, all.filter((e) => e.data.stack === s).length])
);
---
<BaseLayout title={t(lang, 'site.title')} lang={lang}>
  <main class="mx-auto max-w-5xl px-4 py-16">
    <section class="text-center">
      <h1 class="text-fluid-h1 font-bold tracking-tight text-[var(--fg)]">Pipelines CI/CD listos para copiar</h1>
      <p class="mx-auto mt-4 max-w-2xl text-lg text-[var(--fg-muted)]">
        Workflows reutilizables de GitHub Actions por stack, con GitFlow, security gates y deploy.
        Copiá el caller de tu stack, reemplazá <code>&lt;org&gt;</code> y andá.
      </p>
    </section>

    <section class="mt-12">
      <div class="expressive-code-placeholder rounded-lg border border-[var(--border-subtle)] surface p-4 font-mono text-sm">
        <p class="text-[var(--fg-muted)"># .github/workflows/main-deploy.yml</p>
        <p>uses: &lt;org&gt;/ci-templates/.github/workflows/java-main-pipeline.yml@v1</p>
      </div>
    </section>

    <section class="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
      {STACK_ORDER.map((s) => (
        <a href={`/stacks/${s}`}
           class="rounded-lg border border-[var(--border-subtle)] surface p-6 hover:border-brand-500 transition-colors">
          <h2 class="font-semibold text-[var(--fg)]">{STACK_LABELS[s]}</h2>
          <p class="mt-1 text-sm text-[var(--fg-muted)]">{counts[s]} pipelines</p>
        </a>
      ))}
    </section>
  </main>
</BaseLayout>
```

- [ ] **Step 2: Verify landing builds and links resolve**

```bash
pnpm build && pnpm preview &
sleep 3 && curl -sf http://localhost:4321/ | grep -q "listos para copiar" && echo OK
kill %1
```
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: landing page with pitch, quick start, and stack grid"
```

---

## Task 8: Reference (rulesets + CODEOWNERS) + curated explainer guides

**Files:**
- Create: `src/pages/reference/rulesets.astro`
- Create: `src/pages/guides/[slug].astro`
- Create: `src/content/guides/gitflow.mdx`
- Create: `src/content/guides/deploy-targets.mdx`
- Modify: `src/content/guides/quick-start.mdx` (replace placeholder from Task 2)

**Interfaces:**
- Consumes: `pipelines` collection filtered to `kind ∈ {ruleset, codeowners}`; `guides` collection.
- Produces: `/reference/rulesets` page and `/guides/<slug>` explainer pages.

- [ ] **Step 1: Write `src/pages/reference/rulesets.astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { defaultLocale } from '../../i18n/ui';

const lang = defaultLocale;
const all = await getCollection('pipelines');
const refs = all.filter((e) => e.data.kind === 'ruleset' || e.data.kind === 'codeowners');
const rendered = await Promise.all(refs.map(async (e) => ({ d: e.data, Content: (await render(e)).Content })));
---
<BaseLayout title="Rulesets & CODEOWNERS" lang={lang}>
  <main class="mx-auto max-w-4xl px-4 py-10" data-pagefind-body>
    <h1 class="text-fluid-h1 font-bold text-[var(--fg)]">Rulesets & CODEOWNERS</h1>
    {rendered.map(({ d, Content }) => (
      <section class="mt-8">
        <h2 class="text-2xl font-bold text-[var(--fg)]">{d.title}</h2>
        <p class="text-sm text-[var(--fg-muted)]">{d.description}</p>
        <article class="prose prose-slate dark:prose-invert max-w-none mt-2"><Content /></article>
      </section>
    ))}
  </main>
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/guides/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import { defaultLocale } from '../../i18n/ui';

export async function getStaticPaths() {
  const guides = await getCollection('guides');
  return guides.map((entry) => ({ params: { slug: entry.data.slug }, props: { entry } }));
}
const { entry } = Astro.props;
const { Content } = await render(entry);
const lang = defaultLocale;
---
<BaseLayout title={entry.data.title} lang={lang}>
  <main class="mx-auto max-w-3xl px-4 py-10" data-pagefind-body>
    <article class="prose prose-slate dark:prose-invert max-w-none">
      <h1>{entry.data.title}</h1>
      <Content />
    </article>
  </main>
</BaseLayout>
```

- [ ] **Step 3: Write the three explainer MDX files**

`src/content/guides/quick-start.mdx` (replace placeholder):
```mdx
---
title: "Quick Start"
slug: "quick-start"
order: 1
description: "Adoptá los pipelines en tu repo: copiá el caller, reemplazá <org>, configurá secrets."
---

# Quick Start

1. Copiá los templates de tu stack a `.github/workflows/`.
2. Reemplazá `<org>` por tu organización de GitHub en cada `uses:`.
3. Configurá los secrets requeridos (AWS/ECR, EC2 SSH, Slack).

```yaml title=".github/workflows/main-deploy.yml"
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  pipeline:
    uses: <org>/ci-templates/.github/workflows/java-main-pipeline.yml@v1
    with:
      deploy_target: 'ec2-vpn'
      environment: 'prod'
    secrets: inherit
```
```

`src/content/guides/gitflow.mdx`:
```mdx
---
title: "Modelo GitFlow"
slug: "gitflow"
order: 2
description: "Cómo las etapas de GitFlow (feature, PR, develop, release, main) mapean a cada pipeline."
---

# Modelo GitFlow

| Etapa | Trigger | Pipeline | Hace |
|-------|---------|----------|------|
| feature/PR | push feature/*, PR→develop | `*-pr-pipeline` | build→test→coverage→security |
| develop | push→develop | `*-main-pipeline` | build→artifact→deploy(dev)→release PR |
| release | push release/* | `*-main-pipeline` | build→artifact→deploy(staging) |
| main | push→main | `*-main-pipeline` | build→artifact→deploy(prod)→tag+release |
```

`src/content/guides/deploy-targets.mdx`:
```mdx
---
title: "Deploy targets"
slug: "deploy-targets"
order: 3
description: "Valores de deploy_target: ec2, ec2-vpn (WireGuard), eks, s3 — y cuándo usar cada uno."
---

# Deploy targets

| Valor | Destino |
|-------|---------|
| `ec2` | SSH a un EC2 alcanzable directo |
| `ec2-vpn` | SSH a EC2 privado; el runner levanta un túnel WireGuard, despliega y lo baja |
| `eks` | Cluster EKS (manifests o Helm) |
| `s3` | Sitio estático (react/nginx) |
```

- [ ] **Step 4: Verify build**

```bash
pnpm check && pnpm build
```
Expected: 0 errors; `/reference/rulesets`, `/guides/quick-start`, `/guides/gitflow`, `/guides/deploy-targets` all built.

- [ ] **Step 5: Commit**

```bash
git add src/pages/reference/ src/pages/guides/ src/content/guides/
git commit -m "feat: rulesets reference + curated explainer guides"
```

---

## Task 9: Search, nav wiring, and Vercel deploy prep

**Files:**
- Create: `src/pages/search.astro`
- Modify: `src/components/Header.astro` (nav links: Stacks, Guías, Referencia, Buscar)
- Create: `vercel.json`
- Create: `README.md`

**Interfaces:**
- Consumes: Pagefind UI from `astro-pagefind`; `data-pagefind-body` already set on detail/reference/guide pages.
- Produces: `/search` page; header nav; Vercel static config.

- [ ] **Step 1: Write `src/pages/search.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Search from 'astro-pagefind/components/Search';
import { defaultLocale, t } from '../i18n/ui';
const lang = defaultLocale;
---
<BaseLayout title={t(lang, 'nav.search')} lang={lang}>
  <main class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-fluid-h1 font-bold text-[var(--fg)] mb-6">{t(lang, 'nav.search')}</h1>
    <Search id="search" className="pagefind-ui" uiOptions={{ showImages: false }} />
  </main>
</BaseLayout>
```

- [ ] **Step 2: Wire header nav**

In `src/components/Header.astro`, replace the guide/catalog links with links to `/stacks/java` (or a stacks index — use `/` for the stack grid), `/guides/quick-start`, `/reference/rulesets`, `/search`. Remove any remaining ES/EN switcher usage. Use `t(lang, 'nav.*')` keys already defined.

Verify:
```bash
grep -rn "LangSwitcher\|/en/\|getRelativeLocaleUrl" src/ || echo clean
```
Expected: `clean`.

- [ ] **Step 3: Write `vercel.json`**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "astro"
}
```

- [ ] **Step 4: Write `README.md`**

```markdown
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
```

- [ ] **Step 5: Full build gate + search index verification**

```bash
pnpm build
test -d dist/pagefind && echo "pagefind index OK"
pnpm preview &
sleep 3 && curl -sf http://localhost:4321/search | grep -q pagefind && echo "search OK"
kill %1
```
Expected: `pagefind index OK` and `search OK`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/search.astro src/components/Header.astro vercel.json README.md
git commit -m "feat: search page, header nav, and Vercel deploy config"
```

---

## Self-Review Notes

- **Spec coverage:** stack nav (T5), vendored sync + Vercel-absent guard (T4), Expressive Code copy-button (T4 fence + T6), Pagefind (T9), rulesets+CODEOWNERS (T4 collect + T8 page), curated explainers (T8), ES-only (T1 i18n + grep gates in T1/T9), Jenkins excluded (SUBTREES omits `jenkins/`). Landing adoption-first pitch (T7). All spec sections map to a task.
- **Type consistency:** `Stack`/`Kind` enums defined once in `lib/stacks.ts` (T2), imported by schema (T2), pages (T5–T8), and mirrored as string arrays in `sync-pipelines.mjs` (T3). Helper signatures in Task 3 interfaces match their test calls and their Task 4 consumer.
- **Fixture-backed:** the novel logic (sync parser + generator) is TDD'd against `tests/fixtures/ci-templates/` before touching the real repo.
```
