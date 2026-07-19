import { z } from 'zod';

const undefinablePercentage = (min: number) =>
  z
    .transform((val) => (val === 'undefined' ? undefined : val))
    .pipe(z.coerce.number().min(min).max(1).optional());

const undefinableString = z
  .string()
  .transform((val) => (val === 'undefined' ? undefined : val))
  .pipe(z.string().nonempty().optional());

// 'in-process' renders the view inside the app via the inspector dylib (iOS only; other
// platforms fall back to 'screen'), 'screen' takes a full-screen screenshot and crops it.
const undefinableCaptureMode = z
  .transform((val) => (val === 'undefined' ? undefined : val))
  .pipe(z.enum(['in-process', 'screen']).default('screen'));

const screenshotSchema = z.object({
  baseImage: z.string().nonempty(),
  currentScreenshot: z.string().nonempty(),
  diffOutputPath: z.string().nonempty(),
  similarityThreshold: undefinablePercentage(0).default(-1), // default to make TS happy, overridden later
  platform: z.enum(['ios', 'android']),
  resizingFactor: undefinablePercentage(0.1).default(0.5),
  captureMode: undefinableCaptureMode,
});

const viewShotSchema = screenshotSchema.and(
  z.object({
    testID: undefinableString,
    mode: z.enum(['normalize', 'keep-originals']).default('normalize'),
  })
);

export const schema = z.union([viewShotSchema, screenshotSchema]).transform((data) => {
  // Apply conditional default for similarityThreshold based on mode
  if (data.similarityThreshold === undefined || data.similarityThreshold <= 0) {
    const isNormalizationMode = 'mode' in data && data.mode === 'normalize';
    data.similarityThreshold = isNormalizationMode ? 0.15 : 0.05;
  }
  return data;
});
export type RequestBody = z.infer<typeof schema>;
