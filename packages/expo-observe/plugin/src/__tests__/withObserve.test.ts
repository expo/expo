import type { ExpoConfig } from 'expo/config';
import type { ExportedConfig } from 'expo/config-plugins';

import withObserve, { ExpoObserveConfigPluginProps } from '../withObserve';

function createConfig(): ExpoConfig {
  return { name: 'test', slug: 'test', ios: { bundleIdentifier: 'com.example.app' } };
}

function getIosMods(config: ExpoConfig) {
  return (config as ExportedConfig).mods?.ios;
}

function getAppExtensions(config: ExpoConfig) {
  return config.extra?.eas?.build?.experimental?.ios?.appExtensions;
}

describe('ios.crashReporter', () => {
  it.each<[string, ExpoObserveConfigPluginProps | undefined]>([
    ['no props', undefined],
    ['no ios options', {}],
    ['false', { ios: { crashReporter: false } }],
    ['null', { ios: { crashReporter: null } } as unknown as ExpoObserveConfigPluginProps],
  ])('does not add the extension with %s', (_, props) => {
    const config = withObserve(createConfig(), props);
    expect(getAppExtensions(config)).toBeUndefined();
    expect(getIosMods(config)).toBeUndefined();
  });

  it.each<[string, ExpoObserveConfigPluginProps]>([
    ['true', { ios: { crashReporter: true } }],
    ['an empty object', { ios: { crashReporter: {} } }],
  ])('adds the extension with the default bundle identifier with %s', (_, props) => {
    const config = withObserve(createConfig(), props);
    expect(getAppExtensions(config)).toEqual([
      {
        targetName: 'ExpoObserveCrashReporter',
        bundleIdentifier: 'com.example.app.ExpoObserveCrashReporter',
        entitlements: {},
      },
    ]);
    expect(getIosMods(config)?.xcodeproj).toBeDefined();
    expect(getIosMods(config)?.dangerous).toBeDefined();
  });

  it.each(['com.example.app.crashes', 'com.example.app.crash-reporter.v2'])(
    'uses a custom bundle identifier %s',
    (bundleIdentifier) => {
      const config = withObserve(createConfig(), { ios: { crashReporter: { bundleIdentifier } } });
      expect(getAppExtensions(config)).toEqual([
        expect.objectContaining({ targetName: 'ExpoObserveCrashReporter', bundleIdentifier }),
      ]);
    }
  );

  it('keeps other app extensions registered with EAS Build', () => {
    const config = createConfig();
    config.extra = {
      eas: { build: { experimental: { ios: { appExtensions: [{ targetName: 'Widgets' }] } } } },
    };
    const result = withObserve(config, { ios: { crashReporter: true } });
    expect(getAppExtensions(result)).toEqual([
      { targetName: 'Widgets' },
      expect.objectContaining({ targetName: 'ExpoObserveCrashReporter' }),
    ]);
  });

  it('keeps entitlements already registered with EAS Build for the extension', () => {
    const entitlements = { 'com.apple.security.application-groups': ['group.com.example.app'] };
    const config = createConfig();
    config.extra = {
      eas: {
        build: {
          experimental: {
            ios: { appExtensions: [{ targetName: 'ExpoObserveCrashReporter', entitlements }] },
          },
        },
      },
    };
    const result = withObserve(config, { ios: { crashReporter: true } });
    expect(getAppExtensions(result)).toEqual([
      {
        targetName: 'ExpoObserveCrashReporter',
        bundleIdentifier: 'com.example.app.ExpoObserveCrashReporter',
        entitlements,
      },
    ]);
  });

  it.each<[string, unknown]>([
    ['a string', 'no'],
    ['a number', 1],
    ['an array', []],
  ])('throws when crashReporter is %s', (_, crashReporter) => {
    const props = { ios: { crashReporter } } as ExpoObserveConfigPluginProps;
    expect(() => withObserve(createConfig(), props)).toThrow('`ios.crashReporter`');
  });

  it('throws when the app has no iOS bundle identifier', () => {
    expect(() =>
      withObserve({ name: 'test', slug: 'test' }, { ios: { crashReporter: true } })
    ).toThrow('the app has no iOS bundle identifier');
  });

  it.each(['com.example.app.', 'com.example.app..crashes', 'com.example.app.crash_reporter', ''])(
    'throws for the malformed bundle identifier "%s"',
    (bundleIdentifier) => {
      expect(() =>
        withObserve(createConfig(), { ios: { crashReporter: { bundleIdentifier } } })
      ).toThrow('is not valid');
    }
  );

  it('throws for a bundle identifier that is not a string', () => {
    const props = { ios: { crashReporter: { bundleIdentifier: 42 } } };
    expect(() => withObserve(createConfig(), props as any)).toThrow('is not valid');
  });

  it.each(['com.example.app', 'com.example.appx', 'com.other.crashes'])(
    'throws for the bundle identifier "%s" that is not a child of the app bundle identifier',
    (bundleIdentifier) => {
      expect(() =>
        withObserve(createConfig(), { ios: { crashReporter: { bundleIdentifier } } })
      ).toThrow('is not a child of the app\'s bundle identifier "com.example.app"');
    }
  );
});
