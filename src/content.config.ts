import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const blog = defineCollection({
  loader: glob({base:'./src/content/blog',pattern:'*.md'}),
  schema: z.object({
    title:z.string().min(1),
    summary:z.string().min(1),
    category:z.string().min(1),
    photo:z.string().min(1),
    alt:z.string().min(1),
    destination:z.string().min(1),
    minutes:z.number().int().positive(),
    order:z.number().int().positive(),
  }),
});
export const collections={blog};
