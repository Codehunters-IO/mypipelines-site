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

const actions = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/actions' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number().int().min(1),
    description: z.string().max(200),
    repo: z.string().url(),
  }),
});

const gradle = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/gradle' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number().int().min(1),
    description: z.string().max(200),
  }),
});

export const collections = { pipelines, guides, actions, gradle };
