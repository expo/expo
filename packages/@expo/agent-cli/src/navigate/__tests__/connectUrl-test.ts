// @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
//
// The dev-client shape is pinned against the launcher that parses it, not against recollection:
// `EXDevLauncherURLHelper.isDevLauncherURL` is `url.host == "expo-development-client"`, the dev
// server URL rides in the `url` query parameter, and the Swift tests spell one out as
// `scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081` [observed —
// `packages/expo-dev-launcher/ios/Tests/EXDevLauncherURLHelperTests.swift` and the identical
// `android/.../DevLauncherURLHelper.kt`, 2026-08-26]. `@expo/cli` builds the same string in
// `UrlCreator.constructDevClientUrl`.

import { buildConnectUrls, devClientConnectUrl, expoGoConnectUrl } from '../connectUrl';

describe(expoGoConnectUrl, () => {
  it(`is the dev server host under the exp scheme`, () => {
    expect(expoGoConnectUrl('192.168.1.5:8081')).toBe('exp://192.168.1.5:8081');
  });

  it(`carries a tunnel host, which has no port`, () => {
    expect(expoGoConnectUrl('abc.boltexpo.dev')).toBe('exp://abc.boltexpo.dev');
  });
});

describe(devClientConnectUrl, () => {
  // The exact string the launcher's own test asserts.
  it(`matches the shape the dev launcher parses`, () => {
    expect(devClientConnectUrl('scheme', 'localhost:8081', 'localhost')).toBe(
      'scheme://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'
    );
  });

  it(`is a connect URL, not a route link: the host is always the launcher`, () => {
    expect(devClientConnectUrl('myapp', '192.168.1.5:8081', 'lan')).toBe(
      'myapp://expo-development-client/?url=http%3A%2F%2F192.168.1.5%3A8081'
    );
  });

  // @ref packages/@expo/cli/src/start/server/UrlCreator.ts — `constructDevClientUrl` uses `https`
  // when the dev server's own host type is a tunnel, because a tunnel terminates TLS.
  it(`asks a tunnel for https, the way the Expo CLI does`, () => {
    expect(devClientConnectUrl('myapp', 'abc.boltexpo.dev', 'tunnel')).toBe(
      'myapp://expo-development-client/?url=https%3A%2F%2Fabc.boltexpo.dev'
    );
  });

  it(`accepts the exp+<slug> default a managed dev build registers`, () => {
    expect(devClientConnectUrl('exp+notesapp', 'localhost:8081', 'localhost')).toBe(
      'exp+notesapp://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'
    );
  });
});

describe(buildConnectUrls, () => {
  const lan = { host: '192.168.1.5:8081', hostType: 'lan' as const, scheme: 'myapp' };

  it(`names Expo Go alone when Expo Go is what runs this project`, () => {
    expect(buildConnectUrls({ ...lan, isExpoGo: true, certain: true })).toEqual([
      {
        target: 'expo-go',
        label: 'Expo Go',
        url: 'exp://192.168.1.5:8081',
      },
    ]);
  });

  // The whole point of the requirement: `exp://` is the Expo Go form only. A development build
  // opens its own scheme, and handing it an `exp://` link is handing it another app's URL.
  it(`names the app's own scheme when a development build is what runs it`, () => {
    expect(buildConnectUrls({ ...lan, isExpoGo: false, certain: true })).toEqual([
      {
        target: 'dev-build',
        label: 'development build',
        url: 'myapp://expo-development-client/?url=http%3A%2F%2F192.168.1.5%3A8081',
      },
    ]);
  });

  it(`names both, labelled, when nothing established which app is meant`, () => {
    const urls = buildConnectUrls({ ...lan, isExpoGo: false, certain: false });

    expect(urls.map((entry) => entry.target)).toEqual(['expo-go', 'dev-build']);
    expect(urls.map((entry) => entry.label)).toEqual(['Expo Go', 'development build']);
  });

  // A project whose scheme cannot be read has no development-build URL to offer, and a guess with
  // a hole in it is not one either.
  it(`leaves the development build out when no scheme could be resolved`, () => {
    expect(buildConnectUrls({ ...lan, scheme: null, isExpoGo: false, certain: false })).toEqual([
      { target: 'expo-go', label: 'Expo Go', url: 'exp://192.168.1.5:8081' },
    ]);
  });

  it(`answers nothing when there is no dev server to point an app at`, () => {
    expect(
      buildConnectUrls({
        host: null,
        hostType: null,
        scheme: 'myapp',
        isExpoGo: false,
        certain: true,
      })
    ).toEqual([]);
  });

  it(`carries the tunnel host into both forms`, () => {
    const urls = buildConnectUrls({
      host: 'abc.boltexpo.dev',
      hostType: 'tunnel',
      scheme: 'myapp',
      isExpoGo: false,
      certain: false,
    });

    expect(urls[0]!.url).toBe('exp://abc.boltexpo.dev');
    expect(urls[1]!.url).toBe(
      'myapp://expo-development-client/?url=https%3A%2F%2Fabc.boltexpo.dev'
    );
  });
});
