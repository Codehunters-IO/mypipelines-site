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
