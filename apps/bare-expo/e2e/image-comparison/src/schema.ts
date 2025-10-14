import { z } from 'zod';

const screenshotSchema = z.object({
  baseImage: z.string().nonempty(),
  currentScreenshot: z.string().nonempty(),
  diffOutputPath: z.string().nonempty(),
  similarityThreshold: z.number().min(0).max(100).optional(),
  platform: z.enum(['ios', 'android']),
  resizingFactor: z.number().min(0.1).max(1).optional().default(0.5),
});

const viewShotSchema = screenshotSchema.and(
  z.object({
    testID: z.string().nonempty(),
    mode: z.enum(['normalize', 'keep-originals']).default('normalize'),
  })
);

export const schema = z.union([viewShotSchema, screenshotSchema]);
export type RequestBody = z.infer<typeof schema>;
