import { vol } from 'memfs';

import { EXPO_GO_APP_ID, readConfiguredAppId, resolveAppId } from '../appId';

const projectRoot = '/project';

afterEach(() => {
  vol.reset();
});

describe(resolveAppId, () => {
  const base = { platform: 'ios' as const, targetAppIds: [], configured: null };

  it(`should take the flag over everything else`, () => {
    expect(
      resolveAppId({
        ...base,
        appIdOverride: 'com.example.flag',
        targetAppIds: ['com.example.connected'],
        configured: 'com.example.config',
      })
    ).toEqual({
      appId: 'com.example.flag',
      source: 'flag',
      reason: expect.stringContaining('--app-id'),
    });
  });

  // The dev server outranks the app config on purpose: the config says what a *build* of this
  // project would be called, and a project whose config names a bundle identifier can still be
  // running in Expo Go. Stopping the id from the config would then stop nothing and say it did.
  it(`should take the connected app over the app config`, () => {
    expect(
      resolveAppId({
        ...base,
        targetAppIds: ['host.exp.Exponent'],
        configured: 'com.example.config',
      })
    ).toMatchObject({ appId: 'host.exp.Exponent', source: 'dev-server' });
  });

  it(`should name a connected development build as one`, () => {
    expect(resolveAppId({ ...base, targetAppIds: ['com.example.dev'] })).toEqual({
      appId: 'com.example.dev',
      source: 'dev-server',
      reason: expect.stringContaining('com.example.dev'),
    });
  });

  it(`should fall back to the app config when nothing is connected`, () => {
    expect(resolveAppId({ ...base, configured: 'com.example.config' })).toMatchObject({
      appId: 'com.example.config',
      source: 'app-config',
    });
  });

  it(`should fall back to Expo Go, per platform`, () => {
    expect(resolveAppId(base)).toMatchObject({
      appId: EXPO_GO_APP_ID.ios,
      source: 'expo-go-default',
    });
    expect(resolveAppId({ ...base, platform: 'android' })).toMatchObject({
      appId: EXPO_GO_APP_ID.android,
    });
  });

  // The two ids differ only in case, and the wrong one stops nothing on either platform.
  it(`should use the platform's own spelling of the Expo Go id`, () => {
    expect(EXPO_GO_APP_ID.ios).toBe('host.exp.Exponent');
    expect(EXPO_GO_APP_ID.android).toBe('host.exp.exponent');
  });

  // F101's second half, at the chokepoint. The preflight now hands `runtime:stop` a platform-scoped
  // target list, but `runtime:reload`'s device rung resolves an id from a list it read for its own
  // purposes (`reloadAsync.ts`) — so the guard belongs here too, where it costs nothing and cannot
  // be forgotten by the next caller.
  //
  // Only the *other platform's Expo Go id* is rejected, and only when the list holds something else.
  // A wider rule would be a guess: a development build's package name says nothing about a platform,
  // and dropping an id this cannot place would leave a stop with nothing to aim at.
  it(`should not hand a run the other platform's Expo Go id (F101)`, () => {
    expect(
      resolveAppId({
        ...base,
        platform: 'android',
        targetAppIds: ['host.exp.Exponent', 'host.exp.exponent'],
      })
    ).toMatchObject({ appId: 'host.exp.exponent', source: 'dev-server' });

    expect(
      resolveAppId({
        ...base,
        platform: 'ios',
        targetAppIds: ['host.exp.exponent', 'host.exp.Exponent'],
      })
    ).toMatchObject({ appId: 'host.exp.Exponent', source: 'dev-server' });
  });

  it(`falls through rather than acting on an id that is only the other platform's (F101)`, () => {
    // The one app connected is Expo Go on iOS and this run is about Android. There is nothing on
    // Android to stop, so the dev server is no longer evidence and the ladder continues: the answer
    // is Android's own Expo Go id, and `source` says it was a default rather than an observation.
    expect(
      resolveAppId({ ...base, platform: 'android', targetAppIds: ['host.exp.Exponent'] })
    ).toMatchObject({ appId: 'host.exp.exponent', source: 'expo-go-default' });
  });

  it(`keeps an id it cannot place, because a dev build's package names no platform (F101)`, () => {
    expect(
      resolveAppId({
        ...base,
        platform: 'android',
        targetAppIds: ['com.example.devbuild'],
      })
    ).toMatchObject({ appId: 'com.example.devbuild', source: 'dev-server' });
  });

  it(`should always say which evidence it used`, () => {
    for (const input of [
      { ...base, appIdOverride: 'a' },
      { ...base, targetAppIds: ['b'] },
      { ...base, configured: 'c' },
      base,
    ]) {
      expect(resolveAppId(input).reason.length).toBeGreaterThan(0);
    }
  });
});

describe(readConfiguredAppId, () => {
  it(`should read ios.bundleIdentifier and android.package`, () => {
    vol.fromJSON({
      [`${projectRoot}/app.json`]: JSON.stringify({
        expo: {
          ios: { bundleIdentifier: 'com.example.ios' },
          android: { package: 'com.example.android' },
        },
      }),
    });

    expect(readConfiguredAppId(projectRoot, 'ios')).toBe('com.example.ios');
    expect(readConfiguredAppId(projectRoot, 'android')).toBe('com.example.android');
  });

  it(`should accept a config with no expo key`, () => {
    vol.fromJSON({
      [`${projectRoot}/app.config.json`]: JSON.stringify({
        ios: { bundleIdentifier: 'com.example.bare' },
      }),
    });

    expect(readConfiguredAppId(projectRoot, 'ios')).toBe('com.example.bare');
  });

  it(`should answer null when the config names none`, () => {
    vol.fromJSON({ [`${projectRoot}/app.json`]: JSON.stringify({ expo: { slug: 'demo' } }) });

    expect(readConfiguredAppId(projectRoot, 'ios')).toBeNull();
  });

  // A dynamic app config is never evaluated, per the process boundary; such a project falls
  // through to the Expo Go default, which `--app-id` overrides.
  it(`should answer null for a project with no static config`, () => {
    vol.fromJSON({ [`${projectRoot}/app.config.js`]: 'module.exports = {};' });

    expect(readConfiguredAppId(projectRoot, 'ios')).toBeNull();
  });
});

// @ref ../appProcess, ../../navigate/deepLink — `adb shell <words>` is re-parsed by a shell on the
// device, so an application id is a value that reaches a shell. Neither source of one is trusted:
// `app.json` belongs to a project that may have been cloned, and a `/json/list` target is whatever
// answered the dev server.
describe('Application ids from an untrusted source', () => {
  it('should ignore a configured package that carries shell metacharacters', () => {
    vol.fromJSON(
      {
        'app.json': JSON.stringify({
          expo: { android: { package: 'com.x;toybox id > /data/local/tmp/pwned;#' } },
        }),
      },
      projectRoot
    );

    expect(readConfiguredAppId(projectRoot, 'android')).toBeNull();
  });

  it('should ignore a configured bundle identifier that carries a quote', () => {
    vol.fromJSON(
      { 'app.json': JSON.stringify({ expo: { ios: { bundleIdentifier: 'com.x"&calc&"' } } }) },
      projectRoot
    );

    expect(readConfiguredAppId(projectRoot, 'ios')).toBeNull();
  });

  it('should still read a well-formed package', () => {
    vol.fromJSON(
      { 'app.json': JSON.stringify({ expo: { android: { package: 'com.example.demo' } } }) },
      projectRoot
    );

    expect(readConfiguredAppId(projectRoot, 'android')).toBe('com.example.demo');
  });

  it('should skip a dev-server target whose app id carries shell metacharacters', () => {
    expect(
      resolveAppId({
        platform: 'android',
        targetAppIds: ['com.x;toybox id;#', 'com.example.real'],
        configured: null,
      })
    ).toMatchObject({ appId: 'com.example.real', source: 'dev-server' });
  });

  it('should fall through to the default when every dev-server app id is malformed', () => {
    expect(
      resolveAppId({
        platform: 'android',
        targetAppIds: ['com.x;toybox id;#'],
        configured: null,
      })
    ).toMatchObject({ appId: EXPO_GO_APP_ID.android, source: 'expo-go-default' });
  });
});
