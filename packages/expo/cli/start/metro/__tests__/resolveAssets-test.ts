import { resolveManifestAssets, getAssetFieldPathsForManifestAsync } from '../resolveAssets';
jest.mock('../ExpoConfigSchema', () => ({
  getAssetSchemasAsync() {
    return [
      'icon',
      'notification.icon',
      'splash.image',
      'ios.icon',
      'ios.splash.xib',
      'ios.splash.image',
      'ios.splash.tabletImage',
      'android.icon',
      'android.adaptiveIcon.foregroundImage',
      'android.adaptiveIcon.backgroundImage',
      'android.splash.image',
      'android.splash.mdpi',
      'android.splash.hdpi',
      'android.splash.xhdpi',
      'android.splash.xxhdpi',
      'android.splash.xxxhdpi',
      'web.splash.image',
    ];
  },
}));

describe(getAssetFieldPathsForManifestAsync, () => {
  it(`resolves`, async () => {
    expect(
      await getAssetFieldPathsForManifestAsync({
        icon: './icon.png',
        name: '',
        slug: '',
        notification: { icon: './notification.png' },
        android: {
          adaptiveIcon: {
            backgroundImage: './background.png',
            foregroundImage: './foreground.png',
          },
        },
      })
    ).toStrictEqual([
      'icon',
      'notification.icon',
      'android.adaptiveIcon.foregroundImage',
      'android.adaptiveIcon.backgroundImage',
    ]);
  });
});

// describe(resolveManifestAssets, () => {
//   it(`resolves`, () => {
//     resolveManifestAssets('./', {});
//   });
// });
