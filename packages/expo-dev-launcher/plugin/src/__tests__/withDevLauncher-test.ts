import { AndroidConfig } from 'expo/config-plugins';

import { validateConfig } from '../pluginConfig';
import {
  DEFAULT_SERVER_URL_KEY,
  resolveDefaultServerUrl,
  setDefaultServerUrlAndroidManifest,
  setDefaultServerUrlInfoPlist,
} from '../withDevLauncher';

function createAndroidManifest(): AndroidConfig.Manifest.AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android', package: 'com.app' },
      application: [{ $: { 'android:name': '.MainApplication' } }],
    },
  };
}

describe(resolveDefaultServerUrl, () => {
  const emptyEnv: NodeJS.ProcessEnv = {};

  it(`returns undefined when nothing is configured`, () => {
    expect(resolveDefaultServerUrl({}, 'ios', emptyEnv)).toBeUndefined();
    expect(resolveDefaultServerUrl({}, 'android', emptyEnv)).toBeUndefined();
  });

  it(`uses the top-level value for both platforms`, () => {
    const props = { defaultServerUrl: 'http://192.168.1.50:8081' };
    expect(resolveDefaultServerUrl(props, 'ios', emptyEnv)).toBe('http://192.168.1.50:8081');
    expect(resolveDefaultServerUrl(props, 'android', emptyEnv)).toBe('http://192.168.1.50:8081');
  });

  it(`prefers the platform-specific value over the top-level one`, () => {
    const props = {
      defaultServerUrl: 'http://192.168.1.50:8081',
      ios: { defaultServerUrl: 'http://192.168.1.50:8082' },
    };
    expect(resolveDefaultServerUrl(props, 'ios', emptyEnv)).toBe('http://192.168.1.50:8082');
    // android has no override, so it falls back to the top-level value
    expect(resolveDefaultServerUrl(props, 'android', emptyEnv)).toBe('http://192.168.1.50:8081');
  });

  it(`lets the env var override everything`, () => {
    const props = {
      defaultServerUrl: 'http://192.168.1.50:8081',
      ios: { defaultServerUrl: 'http://192.168.1.50:8082' },
    };
    const env = { EXPO_DEV_LAUNCHER_DEFAULT_SERVER_URL: 'http://10.0.0.2:9000' };
    expect(resolveDefaultServerUrl(props, 'ios', env)).toBe('http://10.0.0.2:9000');
    expect(resolveDefaultServerUrl(props, 'android', env)).toBe('http://10.0.0.2:9000');
  });
});

describe(setDefaultServerUrlInfoPlist, () => {
  it(`sets the key the iOS launcher reads`, () => {
    const infoPlist = setDefaultServerUrlInfoPlist({}, 'http://192.168.1.50:8081');
    expect(infoPlist[DEFAULT_SERVER_URL_KEY]).toBe('http://192.168.1.50:8081');
  });
});

describe(setDefaultServerUrlAndroidManifest, () => {
  it(`adds main-application meta-data the Android launcher reads`, () => {
    const manifest = setDefaultServerUrlAndroidManifest(
      createAndroidManifest(),
      'http://192.168.1.50:8082'
    );
    expect(AndroidConfig.Manifest.getMainApplicationMetaDataValue(manifest, DEFAULT_SERVER_URL_KEY)).toBe(
      'http://192.168.1.50:8082'
    );
  });

  it(`replaces rather than duplicates on re-apply (idempotent prebuild)`, () => {
    let manifest = createAndroidManifest();
    manifest = setDefaultServerUrlAndroidManifest(manifest, 'http://192.168.1.50:8082');
    manifest = setDefaultServerUrlAndroidManifest(manifest, 'http://192.168.1.50:9000');

    const metaData = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)['meta-data'] ?? [];
    const matching = metaData.filter((e) => e.$['android:name'] === DEFAULT_SERVER_URL_KEY);
    expect(matching).toHaveLength(1);
    expect(matching[0].$['android:value']).toBe('http://192.168.1.50:9000');
  });
});

describe(validateConfig, () => {
  it(`accepts a defaultServerUrl string`, () => {
    expect(() => validateConfig({ defaultServerUrl: 'http://192.168.1.50:8081' })).not.toThrow();
    expect(() =>
      validateConfig({ ios: { defaultServerUrl: 'http://192.168.1.50:8082' } })
    ).not.toThrow();
  });

  it(`rejects a non-string defaultServerUrl`, () => {
    // @ts-expect-error intentionally invalid type
    expect(() => validateConfig({ defaultServerUrl: 8081 })).toThrow();
  });
});
