import { z } from 'zod';

const undefinablePercentage = (min?: number, defaultValue?: number) =>
  z
    .union([z.number(), z.string(), z.undefined()])
    .transform((val) => (val === 'undefined' ? undefined : val))
    .pipe(
      z.coerce
        .number()
        .min(min ?? 0)
        .max(1)
        .optional()
        .default(defaultValue)
    );

const undefinableString = z
  .string()
  .transform((val) => (val === 'undefined' ? undefined : val))
  .pipe(z.string().nonempty().optional());

const screenshotSchema = z.object({
  baseImage: z.string().nonempty(),
  currentScreenshot: z.string().nonempty(),
  diffOutputPath: z.string().nonempty(),
  similarityThreshold: undefinablePercentage(0),
  platform: z.enum(['ios', 'android']),
  resizingFactor: undefinablePercentage(0.1, 0.5),
});

const viewShotSchema = screenshotSchema.and(
  z.object({
    testID: undefinableString,
    mode: z.enum(['normalize', 'keep-originals']).default('normalize'),
  })
);

export const schema = z
  .union([viewShotSchema, screenshotSchema])
  .transform((data) => {
    // Apply conditional default for similarityThreshold based on mode
    if (data.similarityThreshold === undefined) {
      const isNormalizationMode = 'mode' in data && data.mode === 'normalize';
      data.similarityThreshold = isNormalizationMode ? 0.15 : 0.05;
    }
    return data;
  });
export type RequestBody = z.infer<typeof schema>;
