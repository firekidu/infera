import { z } from 'zod';
export const Field = z.object({
  name: z.string().min(1),
  type: z.enum(['string','number','boolean','text','date','email','phone']),
  required: z.boolean().default(false)
});
export const Collection = z.object({
  name: z.string().min(1),
  fields: z.array(Field).min(1)
});
export const PageComponent = z.object({
  type: z.enum(['table','form']),
  collection: z.string().min(1),
  title: z.string().optional()
});
export const Page = z.object({
  title: z.string().min(1),
  components: z.array(PageComponent).min(1)
});
export const Action = z.object({
  name: z.string(),
  type: z.enum(['webhook','email','langflow']),
  config: z.record(z.any())
});
export const Blueprint = z.object({
  name: z.string().min(1),
  collections: z.array(Collection).min(1),
  pages: z.array(Page).min(1),
  actions: z.array(Action).default([])
});