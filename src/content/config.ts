import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().default('admin'),
    category: z.enum([
      'Comunicato del direttivo',
      'News',
      'Coppa Colli Euganei',
      'Convenzioni',
    ]),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    excerpt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
