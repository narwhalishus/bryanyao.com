import {defineCollection, z} from 'astro:content';
import {glob, file} from 'astro/loaders';

const journal = defineCollection({
  loader: glob({pattern: '**/*.md', base: './content/journal'}),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    cover: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({pattern: '**/*.md', base: './content/projects'}),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    excerpt: z.string().optional(),
    repo: z.string().url().optional(),
    link: z.string().url().optional(),
    draft: z.boolean().default(false),
  }),
});

const photos = defineCollection({
  loader: file('./content/photos/manifest.json'),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    stock: z.string().optional(),
    location: z.string().optional(),
    src: z.string(),
    alt: z.string(),
  }),
});

export const collections = {journal, projects, photos};
