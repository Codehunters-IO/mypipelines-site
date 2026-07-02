// Stack slugs for the pipeline catalog. Extend as ci-templates content grows.
export const STACK_ORDER = [
  'github-actions',
  'gitlab-ci',
  'jenkins',
  'circleci',
  'azure-devops',
] as const;

export type CategorySlug = (typeof STACK_ORDER)[number];
