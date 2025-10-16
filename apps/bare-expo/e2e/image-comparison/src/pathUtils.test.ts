import { describe, expect, it, afterAll } from 'bun:test';

import { transformPaths } from './pathUtils';

describe(transformPaths, () => {
  const testHomeDir = '/Users/dev';
  const e2ePath = '/Users/dev/expo/apps/bare-expo/e2e';

  it('view shots cross platform mode', () => {
    const parsedBody = transformPaths(
      e2ePath,
      {
        baseImage: 'expo-image/view-test-id.base',
        currentScreenshot: 'expo-image/view-test-id_full.android',
        diffOutputPath: '~/.maestro/tests/expo-image',
        similarityThreshold: 0.05,
        resizingFactor: 0.5,
        testID: 'view-test-id',
        platform: 'android' as const,
        mode: 'normalize' as const,
      },
      testHomeDir
    );

    expect(parsedBody).toEqual({
      baseImagePath: `${e2ePath}/expo-image/view-test-id.base.png`,
      viewShotOutputPath: `${e2ePath}/expo-image/view-test-id.png`,
      imageForComparisonPath: `${e2ePath}/expo-image/view-test-id.png`,
      currentScreenshotPath: `${e2ePath}/expo-image/view-test-id_full.android.png`,
      diffOutputFilePath: '/Users/dev/.maestro/tests/expo-image/view-test-id.diff.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/view-test-id_full.android.png',
    });
  });

  it('view shots with platformDependent mode', () => {
    const parsedBody = transformPaths(
      e2ePath,
      {
        baseImage: 'expo-image/view-test-id.base',
        currentScreenshot: 'expo-image/view-test-id_full.ios',
        diffOutputPath: '/Users/dev/.maestro/tests/expo-image',
        similarityThreshold: 0.05,
        resizingFactor: 0.5,
        testID: 'view-test-id',
        platform: 'ios' as const,
        mode: 'keep-originals' as const,
      },
      testHomeDir
    );

    expect(parsedBody).toEqual({
      baseImagePath: `${e2ePath}/expo-image/view-test-id.base.ios.png`,
      imageForComparisonPath: `${e2ePath}/expo-image/view-test-id.ios.png`,
      viewShotOutputPath: `${e2ePath}/expo-image/view-test-id.ios.png`,
      currentScreenshotPath: `${e2ePath}/expo-image/view-test-id_full.ios.png`,
      diffOutputFilePath: '/Users/dev/.maestro/tests/expo-image/view-test-id.diff.ios.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/view-test-id_full.ios.png',
    });
  });

  it('screenshot paths', () => {
    const parsedBody = transformPaths(
      e2ePath,
      {
        baseImage: 'expo-image/comparison-with-core-image.base.android',
        currentScreenshot: 'expo-image/comparison-with-core-image.android',
        diffOutputPath: '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image',
        similarityThreshold: 0.05,
        resizingFactor: 0.5,
        platform: 'android',
      },
      testHomeDir
    );

    expect(parsedBody).toEqual({
      baseImagePath: `${e2ePath}/expo-image/comparison-with-core-image.base.android.png`,
      currentScreenshotPath: `${e2ePath}/expo-image/comparison-with-core-image.android.png`,
      imageForComparisonPath: `${e2ePath}/expo-image/comparison-with-core-image.android.png`,
      diffOutputFilePath:
        '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image.diff.android.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image.android.png',
      viewShotOutputPath: undefined,
    });
  });
});
