import { z } from 'zod';

export const screenshotSchema = z.object({
  baseImage: z.string().nonempty(),
  currentScreenshot: z.string().nonempty(),
  diffOutputPath: z.string().nonempty(),
  similarityThreshold: z.number().min(0).optional(),
  platform: z.enum(['ios', 'android']),
});

export const viewShotSchema = screenshotSchema.and(
  z.object({
    testID: z.string().nonempty(),
    mode: z.enum(['crossPlatform', 'platformDependent']),
  })
);

export const schema = z.union([viewShotSchema, screenshotSchema]);
export type RequestBody = z.infer<typeof schema>;
