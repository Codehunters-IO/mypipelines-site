// Stack slugs for the pipeline catalog. Extend as ci-templates content grows.
export const STACK_ORDER = [
  'github-actions',
  'gitlab-ci',
  'jenkins',
  'circleci',
  'azure-devops',
  // Domain stacks used by the pipelines collection
  'java',
  'krakend',
  'react',
  'nginx',
  'contracts',
  'shared',
] as const;

export type CategorySlug = (typeof STACK_ORDER)[number];
