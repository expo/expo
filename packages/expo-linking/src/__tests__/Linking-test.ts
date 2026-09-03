import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'expo-modules-core';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import * as Linking from '../Linking';
import type { QueryParams } from '../Linking.types';

jest.mock('expo/internal/bundle-origin', () => ({ getBundleOrigin: jest.fn(() => null) }));

/** Mock the origin the running bundle was loaded from. */
function mockDevServerUrl(url: string | null): void {
  jest
    .mocked(require('expo/internal/bundle-origin').getBundleOrigin)
    .mockReturnValue(url && new URL(url).origin);
}

describe('parse', () => {
  beforeAll(() => {
    mockProperty(Constants.manifest as any, 'hostUri', 'exp.host/@test/test');
  });
  afterAll(() => {
    unmockAllProperties();
  });

  test.each<string>([
    'exp://127.0.0.1:8081/',
    'exp://127.0.0.1:8081/--/test/path?query=param',
    'exp://127.0.0.1:8081?query=param',
    'exp://exp.host/@test/test/--/test/path?query=param',
    'exp://exp.host/@test/test/--/test/path',
    'https://example.com/test/path?query=param',
    'https://example.com/test/path',
    'https://example.com:8000/test/path',
    'https://example.com:8000/test/path+with+plus',
    'https://example.com/test/path?query=do+not+escape',
    'https://example.com/test/path?missingQueryValue=',
    'custom:///?shouldBeEscaped=x%252By%2540xxx.com',
    'custom:///test/path?foo=bar',
    'custom:///',
    'custom://',
    'custom://?hello=bar',
    'invalid',
  ])(`parses %p`, (url) => {
    expect(Linking.parse(url)).toMatchSnapshot();
  });

  it(`does not decode query params twice`, () => {
    expect(Linking.parse('custom:///?shouldBeEscaped=x%252By%2540xxx.com').queryParams).toEqual({
      shouldBeEscaped: 'x%2By%40xxx.com',
    });
  });

  it(`does not throw on malformed percent-encoding`, () => {
    expect(Linking.parse('custom:///?q=%GG').queryParams).toEqual({ q: '%GG' });
  });
});

describe(Linking.unwrapDevLaunchURL, () => {
  it(`returns the target of a legacy development client launch URL`, () => {
    expect(
      Linking.unwrapDevLaunchURL(
        'bacon://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081&__expo_launch_token=abc'
      )
    ).toBe('http://127.0.0.1:8081');
  });

  it(`returns an empty string for a legacy launch URL without a target`, () => {
    expect(Linking.unwrapDevLaunchURL('app.bacon.expo://expo-development-client')).toBe('');
  });

  it(`returns the target given by __expo_url on any host`, () => {
    expect(
      Linking.unwrapDevLaunchURL(
        'bacon://?__expo_url=http%3A%2F%2F127.0.0.1%3A8081%2Fpath%3Fx%3D1&__expo_show_menu_at_launch=0'
      )
    ).toBe('http://127.0.0.1:8081/path?x=1');
  });

  it(`removes the reserved params from an Expo Go URL`, () => {
    expect(
      Linking.unwrapDevLaunchURL(
        'exp://127.0.0.1:8081?__expo_show_menu_at_launch=0&__expo_tools_button=0&__expo_disable_onboarding=1'
      )
    ).toBe('exp://127.0.0.1:8081');
  });

  it(`keeps the other params`, () => {
    expect(
      Linking.unwrapDevLaunchURL('exp://127.0.0.1:8081/--/path?__expo_show_menu_at_launch=0&x=1')
    ).toBe('exp://127.0.0.1:8081/--/path?x=1');
  });

  it(`removes a reserved param from an app deep link`, () => {
    expect(Linking.unwrapDevLaunchURL('myapp://login?__expo_launch_token=abc')).toBe(
      'myapp://login'
    );
  });

  it(`returns other URLs unchanged`, () => {
    expect(Linking.unwrapDevLaunchURL('myapp://path?x=1')).toBe('myapp://path?x=1');
    expect(Linking.unwrapDevLaunchURL('my_app://foo')).toBe('my_app://foo');
    expect(Linking.unwrapDevLaunchURL('invalid')).toBe('invalid');
    expect(Linking.unwrapDevLaunchURL('exp://127.0.0.1:8081?disableOnboarding=1')).toBe(
      'exp://127.0.0.1:8081?disableOnboarding=1'
    );
  });
});

describe(Linking.createURL, () => {
  const consoleWarn = console.warn;
  const executionEnvironment = Constants.executionEnvironment;

  describe('queries', () => {
    describe.each<string>(['exp.host/@test/test', 'u.expo.dev/update/some-guid'])(
      `for hostUri %p`,
      (hostUri) => {
        beforeEach(() => {
          console.warn = jest.fn();
          Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
          mockProperty(Constants.manifest as any, 'hostUri', hostUri);
          mockProperty(Constants.manifest as any, 'scheme', 'demo');
        });

        afterEach(() => {
          console.warn = consoleWarn;
          Constants.executionEnvironment = executionEnvironment;
          unmockAllProperties();
        });

        test.each<QueryParams>([
          { shouldEscape: '%2b%20' },
          { escapePluses: 'email+with+plus@whatever.com' },
          { emptyParam: '' },
          { undefinedParam: undefined },
          { lotsOfSlashes: '/////' },
        ])(`makes url %p`, (queryParams) => {
          expect(Linking.createURL('some/path', { queryParams })).toMatchSnapshot();
        });

        test.each<string>(['path/into/app', ''])(`makes url %p`, (path) => {
          expect(Linking.createURL(path)).toMatchSnapshot();
        });
      }
    );
  });

  // The web platform has its own `createURL` implementation, which uses `window.location`.
  const describeNative = Platform.OS === 'web' ? describe.skip : describe;

  describeNative('development server', () => {
    let rawManifest: any;

    beforeEach(() => {
      console.warn = jest.fn();
      Constants.executionEnvironment = ExecutionEnvironment.StoreClient;
      rawManifest = (Constants as any).__rawManifest_TEST;
      (Constants as any).__rawManifest_TEST = {
        metadata: {},
        extra: {
          expoClient: { hostUri: '127.0.0.1:8081' },
          expoGo: { developer: { tool: 'expo-cli' } },
        },
      };
    });

    afterEach(() => {
      console.warn = consoleWarn;
      Constants.executionEnvironment = executionEnvironment;
      (Constants as any).__rawManifest_TEST = rawManifest;
      mockDevServerUrl(null);
    });

    it(`prefers the bundle URL authority over hostUri`, () => {
      // The dev server may be reached through an address it can't observe itself, and `hostUri` then
      // names an address this device can't reach.
      mockDevServerUrl('http://proxy.test/');
      expect(Linking.createURL('some/path')).toBe('exp://proxy.test/--/some/path');
    });

    it(`keeps the bundle URL's port`, () => {
      mockDevServerUrl('http://proxy.test:4443/');
      expect(Linking.createURL('some/path')).toBe('exp://proxy.test:4443/--/some/path');
    });

    it(`uses the "exps" scheme for an HTTPS dev server`, () => {
      // Expo Go maps `exps` to HTTPS; `exp` would make it request the dev server over HTTP.
      mockDevServerUrl('https://proxy.test/');
      expect(Linking.createURL('some/path')).toBe('exps://proxy.test/--/some/path');
    });

    it(`falls back to hostUri when the bundle wasn't loaded from a server`, () => {
      mockDevServerUrl(null);
      expect(Linking.createURL('some/path')).toBe('exp://127.0.0.1:8081/--/some/path');
    });

    it(`parses a deep link made against the bundle URL authority`, () => {
      mockDevServerUrl('http://proxy.test/');
      expect(Linking.parse('exp://proxy.test/--/test/path?query=param')).toEqual({
        hostname: null,
        path: 'test/path',
        queryParams: { query: 'param' },
        scheme: 'exp',
      });
    });
  });

  describe('bare', () => {
    beforeEach(() => {
      console.warn = jest.fn();
      Constants.executionEnvironment = ExecutionEnvironment.Bare;
      mockProperty(Constants.manifest as any, 'hostUri', null);
      mockProperty(Constants.manifest as any, 'scheme', 'demo');
    });

    afterEach(() => {
      console.warn = consoleWarn;
      Constants.executionEnvironment = executionEnvironment;
      unmockAllProperties();
    });

    test.each<QueryParams>([
      { shouldEscape: '%2b%20' },
      { escapePluses: 'email+with+plus@whatever.com' },
      { emptyParam: '' },
      { undefinedParam: undefined },
      { lotsOfSlashes: '/////' },
    ])(`makes url %p`, (queryParams) => {
      expect(Linking.createURL('some/path', { queryParams })).toMatchSnapshot();
    });

    test.each<string>(['path/into/app', ''])(`makes url %p`, (path) => {
      expect(Linking.createURL(path)).toMatchSnapshot();
    });

    it(`uses triple slashes`, () => {
      expect(Linking.createURL('some/path', { isTripleSlashed: true })).toMatchSnapshot();
    });
  });
});
