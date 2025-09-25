import { transformPaths } from './pathUtils';

describe(transformPaths, () => {
  test('view shots cross platform', () => {
    const parsedBody = transformPaths(
      '/Users/dev/expo/apps/bare-expo/e2e',
      {
        baseImage: 'expo-image/view-test-id.base',
        currentScreenshot: 'expo-image/view-test-id_full.android',
        diffOutputPath: '~/.maestro/tests/expo-image',
        similarityThreshold: 5,
        testID: 'view-test-id',
        platform: 'android' as const,
        mode: 'crossPlatform' as const,
      },
      '/Users/dev'
    );

    expect(parsedBody).toEqual({
      baseImagePath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.base.png',
      viewShotOutputPath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.png',
      imageForComparisonPath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.png',
      currentScreenshotPath:
        '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id_full.android.png',
      diffOutputFilePath: '/Users/dev/.maestro/tests/expo-image/view-test-id.diff.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/view-test-id_full.android.png',
    });
  });

  test('view shots with platformDependent mode', () => {
    const parsedBody = transformPaths('/Users/dev/expo/apps/bare-expo/e2e', {
      baseImage: 'expo-image/view-test-id.base',
      currentScreenshot: 'expo-image/view-test-id_full.ios',
      diffOutputPath: '/Users/dev/.maestro/tests/expo-image',
      similarityThreshold: 5,
      testID: 'view-test-id',
      platform: 'ios' as const,
      mode: 'platformDependent' as const,
    });

    expect(parsedBody).toEqual({
      baseImagePath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.base.ios.png',
      imageForComparisonPath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.ios.png',
      viewShotOutputPath: '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id.ios.png',
      currentScreenshotPath:
        '/Users/dev/expo/apps/bare-expo/e2e/expo-image/view-test-id_full.ios.png',
      diffOutputFilePath: '/Users/dev/.maestro/tests/expo-image/view-test-id.diff.ios.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/view-test-id_full.ios.png',
    });
  });

  test('for screenshots', () => {
    const parsedBody = transformPaths('/Users/dev/expo/apps/bare-expo/e2e', {
      baseImage: 'expo-image/comparison-with-core-image.base.android',
      currentScreenshot: 'expo-image/comparison-with-core-image.android',
      diffOutputPath: '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image',
      similarityThreshold: 5,
      platform: 'android',
    });

    expect(parsedBody).toEqual({
      baseImagePath:
        '/Users/dev/expo/apps/bare-expo/e2e/expo-image/comparison-with-core-image.base.android.png',
      currentScreenshotPath:
        '/Users/dev/expo/apps/bare-expo/e2e/expo-image/comparison-with-core-image.android.png',
      imageForComparisonPath:
        '/Users/dev/expo/apps/bare-expo/e2e/expo-image/comparison-with-core-image.android.png',
      diffOutputFilePath:
        '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image.diff.android.png',
      currentScreenshotArtifactPath:
        '/Users/dev/.maestro/tests/expo-image/comparison-with-core-image.android.png',
      viewShotOutputPath: undefined,
    });
  });
});
