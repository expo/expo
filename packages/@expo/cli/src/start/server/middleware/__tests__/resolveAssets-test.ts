import { vol } from 'memfs';

import * as Log from '../../../../log';
import {
  getAssetFieldPathsForManifestAsync,
  resolveGoogleServicesFile,
  resolveSplashScreenAssets,
} from '../resolveAssets';

jest.mock(`../../../../log`);
jest.mock('../../../../api/getExpoSchema', () => ({
  getAssetSchemasAsync() {
    return [
      'icon',
      'notification.icon',
      'splash.image',
      'ios.icon',
      'android.icon',
      'android.adaptiveIcon.foregroundImage',
      'android.adaptiveIcon.backgroundImage',
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

describe(resolveSplashScreenAssets, () => {
  const projectRoot = '/';

  const resolver = jest.fn((assetPath: string) =>
    Promise.resolve(`http://localhost/assets/${assetPath}`)
  );

  beforeEach(() => {
    resolver.mockClear();
  });

  it(`does nothing when extra is missing`, async () => {
    vol.fromJSON({}, projectRoot);

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: {},
      },
    });

    expect(resolver).not.toHaveBeenCalled();
  });

  it(`resolves android and ios image paths`, async () => {
    vol.fromJSON(
      {
        'assets/splash.png': 'image',
        'assets/splash-tablet.png': 'image',
        'assets/splash-dark.png': 'image',
      },
      projectRoot
    );

    const splash = {
      android: { image: './assets/splash.png' },
      ios: {
        image: './assets/splash.png',
        tabletImage: './assets/splash-tablet.png',
        dark: { image: './assets/splash-dark.png' },
      },
    };

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: { 'expo-splash-screen': splash },
      },
    });

    expect(splash.android.image).toBe('http://localhost/assets/./assets/splash.png');
    expect(splash.ios.image).toBe('http://localhost/assets/./assets/splash.png');
    expect(splash.ios.tabletImage).toBe('http://localhost/assets/./assets/splash-tablet.png');
    expect(splash.ios.dark.image).toBe('http://localhost/assets/./assets/splash-dark.png');
  });

  it(`resolves android density-specific images`, async () => {
    vol.fromJSON(
      {
        'assets/mdpi.png': 'image',
        'assets/xxxhdpi.png': 'image',
      },
      projectRoot
    );

    const configs = {
      android: { mdpi: './assets/mdpi.png', xxxhdpi: './assets/xxxhdpi.png' },
      ios: {},
    };

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: { 'expo-splash-screen': configs },
      },
    });

    expect(configs.android.mdpi).toBe('http://localhost/assets/./assets/mdpi.png');
    expect(configs.android.xxxhdpi).toBe('http://localhost/assets/./assets/xxxhdpi.png');
  });

  it(`skips values that are already URLs`, async () => {
    vol.fromJSON({}, projectRoot);

    const configs = {
      android: { image: 'https://example.com/splash.png' },
      ios: { image: 'https://example.com/splash.png' },
    };

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: { 'expo-splash-screen': configs },
      },
    });

    expect(resolver).not.toHaveBeenCalled();
    expect(configs.android.image).toBe('https://example.com/splash.png');
  });

  it(`warns when a local asset file is missing`, async () => {
    vol.fromJSON({}, projectRoot);

    const configs = {
      android: { image: './missing.png' },
      ios: {},
    };

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: { 'expo-splash-screen': configs },
      },
    });

    expect(resolver).not.toHaveBeenCalled();
    expect(Log.warn).toHaveBeenCalledWith(
      `Unable to resolve asset "./missing.png" from "extra["expo-splash-screen"]" in your app config`
    );
  });

  it(`skips non-string values`, async () => {
    vol.fromJSON({}, projectRoot);

    const configs = {
      android: { image: undefined, backgroundColor: '#ffffff' },
      ios: { image: undefined },
    };

    await resolveSplashScreenAssets(projectRoot, {
      resolver,
      manifest: {
        name: '',
        slug: '',
        extra: { 'expo-splash-screen': configs },
      },
    });

    expect(resolver).not.toHaveBeenCalled();
  });
});
