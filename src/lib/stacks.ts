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
