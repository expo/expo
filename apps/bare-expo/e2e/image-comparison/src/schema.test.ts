import { describe, expect, it } from 'bun:test';

import { schema } from './schema';

describe('Zod schema validation', () => {
  const testData = {
    baseImage: 'expo-image/image-comparison-list.base.png',
    currentScreenshot: 'expo-image/image-comparison-list_full.android.png',
    diffOutputPath: '~/.maestro/tests/expo-image/image-comparison-list.diff.png',
    similarityThreshold: 0.05,
    testID: 'image-comparison-list',
    platform: 'android' as const,
    mode: 'keep-originals' as const,
  };

  it('should validate data with testID and mode', () => {
    const parsedBody = schema.parse(testData);

    expect(parsedBody).toEqual({ ...testData, resizingFactor: 0.5 });

    expect(
      schema.parse({
        baseImage: 'expo-image/image-comparison-list.base.png',
        currentScreenshot: 'expo-image/image-comparison-list_full.android.png',
        diffOutputPath: '~/.maestro/tests/expo-image/image-comparison-list.diff.png',
        platform: 'android' as const,
        mode: 'keep-originals' as const,
        // maestro may pass undefined strings
        similarityThreshold: 'undefined',
        resizingFactor: 'undefined',
        testID: 'undefined',
      })
    ).toEqual({
      baseImage: 'expo-image/image-comparison-list.base.png',
      currentScreenshot: 'expo-image/image-comparison-list_full.android.png',
      diffOutputPath: '~/.maestro/tests/expo-image/image-comparison-list.diff.png',
      platform: 'android',
      mode: 'keep-originals',
      resizingFactor: 0.5,
      similarityThreshold: 0.05,
      testID: undefined,
    });
  });

  it('should default similarityThreshold to 0.15 for normalize mode', () => {
    const result = schema.parse({
      baseImage: 'expo-image/test.base.png',
      currentScreenshot: 'expo-image/test.png',
      diffOutputPath: '~/.maestro/tests/expo-image/test.diff.png',
      platform: 'android' as const,
      mode: 'normalize' as const,
      testID: 'test-id',
    });

    expect(result.similarityThreshold).toBe(0.15);
  });

  it('should default similarityThreshold to 0.05 for keep-originals mode', () => {
    const result = schema.parse({
      baseImage: 'expo-image/test.base.png',
      currentScreenshot: 'expo-image/test.png',
      diffOutputPath: '~/.maestro/tests/expo-image/test.diff.png',
      platform: 'android' as const,
      mode: 'keep-originals' as const,
      testID: 'test-id',
    });

    expect(result.similarityThreshold).toBe(0.05);
  });

  it('should default similarityThreshold to 0.05 for screenshot mode (no mode field)', () => {
    const result = schema.parse({
      baseImage: 'expo-image/test.base.png',
      currentScreenshot: 'expo-image/test.png',
      diffOutputPath: '~/.maestro/tests/expo-image/test.diff.png',
      platform: 'android' as const,
    });

    expect(result.similarityThreshold).toBe(0.05);
  });

  it('should allow explicit similarityThreshold to override default', () => {
    const result = schema.parse({
      baseImage: 'expo-image/test.base.png',
      currentScreenshot: 'expo-image/test.png',
      diffOutputPath: '~/.maestro/tests/expo-image/test.diff.png',
      platform: 'android' as const,
      mode: 'normalize' as const,
      testID: 'test-id',
      similarityThreshold: 0.25,
    });

    expect(result.similarityThreshold).toBe(0.25);
  });
});
