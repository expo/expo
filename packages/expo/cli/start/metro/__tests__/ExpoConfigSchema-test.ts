import * as ExpoConfigSchema from '../ExpoConfigSchema';

describe(`getAssetSchemasAsync return array of strings including some known values`, () => {
  test.each([
    [
      '38.0.0',
      ['icon', 'notification.icon', 'splash.image', 'ios.splash.xib', 'android.splash.xxhdpi'],
    ],
    [
      'UNVERSIONED',
      ['icon', 'notification.icon', 'splash.image', 'ios.splash.xib', 'android.splash.xxhdpi'],
    ],
  ])('for SDK %s', async (sdkVersion, expectedAssetsPaths) => {
    const schemas = await ExpoConfigSchema.getAssetSchemasAsync(sdkVersion);
    expect(schemas.every((field) => typeof field === 'string')).toBe(true);
    for (const el of expectedAssetsPaths) {
      expect(schemas).toContain(el);
    }
  });
});
