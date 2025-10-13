import { z } from 'zod';

const screenshotSchema = z.object({
  baseImage: z.string().nonempty(),
  currentScreenshot: z.string().nonempty(),
  diffOutputPath: z.string().nonempty(),
  similarityThreshold: z.number().min(0).max(100).optional(),
  platform: z.enum(['ios', 'android']),
});

const viewShotSchema = screenshotSchema.and(
  z.object({
    testID: z.string().nonempty(),
    mode: z.enum(['normalize', 'keep-originals']),
  })
);

export const schema = z.union([viewShotSchema, screenshotSchema]);
export type RequestBody = z.infer<typeof schema>;
