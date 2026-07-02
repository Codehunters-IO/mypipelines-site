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
