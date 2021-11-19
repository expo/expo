import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'expo-modules-core';
import { mockProperty, unmockAllProperties } from 'jest-expo';

import { SessionUrlProvider } from '../SessionUrlProvider';

const managedSessionUrlProvider = new SessionUrlProvider();

function applyMocks() {
  mockProperty(Constants.manifest, 'originalFullName', '@example/abc');
  mockProperty(Constants.manifest, 'scheme', 'my-app');
}

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

describe('getStartUrl', () => {
  it(`returns the correct start URL from getStartUrl`, () => {
    const authUrl = 'https://signin.com';
    const returnUrl = 'exp://expo.io/@example/abc+';
    const result = managedSessionUrlProvider.getStartUrl(authUrl, returnUrl);
    expect(result).toEqual(
      Platform.select({
        default:
          'https://auth.expo.io/@example/abc/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexpo.io%2F%40example%2Fabc%2B',
        web: Platform.isDOMAvailable
          ? 'http://localhost/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexpo.io%2F%40example%2Fabc%2B'
          : '',
      })
    );
  });
});

describe(`getRedirectUrl`, () => {
  // All native apps kinda work the same in SDK 41+ :kinda_cool_guy:
  for (const execution of [
    ExecutionEnvironment.StoreClient,
    ExecutionEnvironment.Bare,
    ExecutionEnvironment.Standalone,
  ]) {
    describe(execution, () => {
      beforeEach(() => {
        mockProperty(Constants, 'executionEnvironment', execution);
        mockProperty(Constants.manifest, 'scheme', 'my-app');
        mockProperty(Constants.manifest, 'originalFullName', '@example/abc');
      });
      const originalWarn = console.warn;

      beforeEach(() => {
        console.warn = jest.fn();
      });
      afterEach(() => (console.warn = originalWarn));

      it(`checks return url`, () => {
        expect(managedSessionUrlProvider.getRedirectUrl()).toEqual(
          Platform.select({
            default: 'https://auth.expo.io/@example/abc',
            web: Platform.isDOMAvailable ? 'http://localhost' : '',
          })
        );
      });

      if (Platform.OS !== 'web') {
        it(`throws a useful error if originalFullName and id are not defined`, () => {
          mockProperty(Constants.manifest, 'originalFullName', undefined);
          mockProperty(Constants.manifest, 'id', undefined);

          const errorName = {
            [ExecutionEnvironment.StoreClient]:
              /Cannot use AuthSession proxy because the project ID is not defined. Please report this as a bug/,
            [ExecutionEnvironment.Bare]:
              /Cannot use AuthSession proxy because the project ID is not defined. Please ensure you have the latest/,
            [ExecutionEnvironment.Standalone]:
              /Cannot use AuthSession proxy because the project ID is not defined./,
          };
          expect(() => managedSessionUrlProvider.getRedirectUrl()).toThrowError(
            errorName[execution]
          );
        });
      }
    });
  }
});

if (Platform.OS !== 'web') {
  describe(`getDefaultReturnUrl`, () => {
    describe('storeClient', () => {
      beforeEach(() => {
        mockProperty(Constants, 'executionEnvironment', 'storeClient');
        mockProperty(Constants.manifest, 'scheme', 'my-app');
        mockProperty(Constants.manifest, 'hostUri', 'exp.host/@test/test');
      });
      it(`checks return url`, () => {
        mockProperty(Constants.manifest, 'hostUri', 'exp.host/@example/abc');
        expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
          'exp://exp.host/@example/abc/--/expo-auth-session'
        );
      });
      it(`checks return url with options`, () => {
        mockProperty(Constants.manifest, 'hostUri', 'exp.host/@example/abc');
        const result = managedSessionUrlProvider.getDefaultReturnUrl('/foobar', {
          isTripleSlashed: true,
          scheme: 'foobar',
        });
        expect(result).toEqual('exp://exp.host/@example/abc/--/expo-auth-session/foobar');
      });
      it(`checks return url with multiple schemes and no default provided`, () => {
        mockProperty(Constants.manifest, 'scheme', ['my-app-1', 'my-app-2']);
        // Ensure no warning is thrown in store client
        expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
          'exp://exp.host/@test/test/--/expo-auth-session'
        );
      });
      it(`checks url with the release channel`, () => {
        mockProperty(
          Constants.manifest,
          'hostUri',
          'exp.host/@example/abc?release-channel=release-channel'
        );

        expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
          'exp://exp.host/@example/abc/--/expo-auth-session?release-channel=release-channel'
        );
      });
    });

    // Custom apps should all work the same in SDK 41+ :cool_guy_emoji:
    for (const execution of [ExecutionEnvironment.Bare, ExecutionEnvironment.Standalone]) {
      describe(execution, () => {
        beforeEach(() => {
          mockProperty(Constants, 'executionEnvironment', execution);
          mockProperty(Constants.manifest, 'scheme', 'my-app');
        });
        const originalWarn = console.warn;

        beforeEach(() => {
          console.warn = jest.fn();
        });
        afterEach(() => (console.warn = originalWarn));

        it(`checks return url`, () => {
          mockProperty(Constants.manifest, 'hostUri', 'exp.host/@example/abc');
          const result = managedSessionUrlProvider.getDefaultReturnUrl();

          expect(result).toEqual('my-app://expo-auth-session');
        });
        it(`throws if no scheme is defined`, () => {
          mockProperty(Constants.manifest, 'scheme', undefined);
          expect(() => managedSessionUrlProvider.getDefaultReturnUrl()).toThrow(
            'not make a deep link into a standalone app with no custom scheme defined'
          );
        });
        it(`checks return url with options`, () => {
          mockProperty(Constants.manifest, 'hostUri', 'exp.host/@example/abc');
          const result = managedSessionUrlProvider.getDefaultReturnUrl('/foobar', {
            isTripleSlashed: true,
            scheme: 'foobar',
          });
          // ensure we warn about the invalid config or invocation.
          expect(console.warn).toHaveBeenCalledWith(
            `The provided Linking scheme 'foobar' does not appear in the list of possible URI schemes in your Expo config. Expected one of: 'my-app'`
          );
          expect(result).toEqual('foobar:///expo-auth-session/foobar');
        });
        it(`checks return url with multiple schemes and no default provided`, () => {
          mockProperty(Constants.manifest, 'scheme', ['my-app-1', 'my-app-2']);
          const result = managedSessionUrlProvider.getDefaultReturnUrl();
          // Ensure we silenced the warnings when multiple schemes can be found.
          expect(console.warn).not.toHaveBeenCalled();
          expect(result).toEqual('my-app-1://expo-auth-session');
        });

        it(`checks url with the release channel`, () => {
          mockProperty(
            Constants.manifest,
            'hostUri',
            'exp.host/@example/abc?release-channel=release-channel'
          );

          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'my-app://expo-auth-session?release-channel=release-channel'
          );
        });
      });
    }
  });
}
