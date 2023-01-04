import { vol } from 'memfs';

import * as Log from '../../../../log';
import { getAssetFieldPathsForManifestAsync, resolveGoogleServicesFile } from '../resolveAssets';

jest.mock(`../../../../log`);
jest.mock('../../../../api/getExpoSchema', () => ({
  getAssetSchemasAsync() {
    return [
      'icon',
      'notification.icon',
      'splash.image',
      'ios.icon',
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

beforeEach(() => {
  vol.reset();
});

describe(resolveGoogleServicesFile, () => {
  const projectRoot = '/';

  it(`does nothing`, async () => {
    vol.fromJSON({}, projectRoot);

    expect(await resolveGoogleServicesFile(projectRoot, {})).toEqual({});
  });

  it(`resolves google services files`, async () => {
    vol.fromJSON(
      {
        'android/google-services.json': '{}',
        'ios/GoogleServices-Info.plist': '<foo></foo>',
      },
      projectRoot
    );

    expect(
      await resolveGoogleServicesFile(projectRoot, {
        android: {
          googleServicesFile: './android/google-services.json',
        },
        ios: {
          googleServicesFile: './ios/GoogleServices-Info.plist',
        },
      })
    ).toEqual({
      android: {
        // UTF-8 encoded JSON
        googleServicesFile: '{}',
      },
      ios: {
        // Base 64 encoded XML
        googleServicesFile: 'PGZvbz48L2Zvbz4=',
      },
    });
  });

  it(`warns when the defined files are missing`, async () => {
    vol.fromJSON({}, projectRoot);

    expect(
      await resolveGoogleServicesFile(projectRoot, {
        android: {
          googleServicesFile: './android/google-services.json',
        },
        ios: {
          googleServicesFile: './ios/GoogleServices-Info.plist',
        },
      })
    ).toEqual({
      // Field deleted.
      android: {},
      // Field deleted.
      ios: {},
    });

    expect(Log.warn).toHaveBeenNthCalledWith(
      1,
      `Could not parse Expo config: android.googleServicesFile: "./android/google-services.json"`
    );
    expect(Log.warn).toHaveBeenNthCalledWith(
      2,
      `Could not parse Expo config: ios.googleServicesFile: "./ios/GoogleServices-Info.plist"`
    );
  });
});
