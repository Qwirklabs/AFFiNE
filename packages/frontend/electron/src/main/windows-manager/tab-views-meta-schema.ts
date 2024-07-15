import { z } from 'zod';

export const tabViewsMetaSchema = z.object({
  activeWorkbenchKey: z.string().optional(),
  workbenches: z
    .array(
      z.object({
        key: z.string(),
        activeViewIndex: z.number(),
        pinned: z.boolean().optional(),
        basename: z.string(),
        views: z.array(
          z.object({
            id: z.string(),
            path: z
              .object({
                hash: z.string(),
                pathname: z.string(),
                search: z.string(),
              })
              .optional(),
            title: z.string().optional(),
            moduleName: z
              .enum(['trash', 'all', 'collection', 'tag', 'doc', 'journal'])
              .optional(),
          })
        ),
      })
    )
    .default([]),
});

export const TabViewsMetaKey = 'tabViewsMetaSchema';
export type TabViewsMetaSchema = z.infer<typeof tabViewsMetaSchema>;
