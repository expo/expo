import { schema } from './schema';

describe('Zod schema validation', () => {
  const testData = {
    baseImage: 'expo-image/image-comparison-list.base.png',
    currentScreenshot: 'expo-image/image-comparison-list_full.android.png',
    diffOutputPath: '~/.maestro/tests/expo-image/image-comparison-list.diff.png',
    similarityThreshold: 5,
    testID: 'image-comparison-list',
    platform: 'android' as const,
    mode: 'crossPlatform' as const,
  };

  test('should validate data with testID and mode', () => {
    const parsedBody = schema.parse(testData);

    expect(parsedBody).toEqual(testData);
  });
});
