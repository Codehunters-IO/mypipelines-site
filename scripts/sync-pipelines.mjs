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

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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
    const description = (extractDescription(raw) || `${kind} ${slug}`).slice(0, 200);
    const fm = [
      '---',
      `title: ${JSON.stringify(titleFor(slug, kind))}`,
      `slug: "${slug}"`,
      `stack: "${stack}"`,
      `kind: "${kind}"`,
      `type: "${type}"`,
      `triggers: ${JSON.stringify(triggers)}`,
      `description: ${JSON.stringify(description)}`,
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
