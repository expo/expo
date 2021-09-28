import { Platform } from '@unimodules/react-native-adapter';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { mockProperty, unmockAllProperties } from 'jest-expo';
import { v4 as uuidv4 } from 'uuid';

import { SessionUrlProvider } from '../SessionUrlProvider';

const managedSessionUrlProvider = new SessionUrlProvider();
const generatedProjectId = uuidv4();

describe.each([true, false])('use new manifest: %p', (useNewManifest) => {
  function applyManifestMocks({
    originalFullName,
    scheme,
    projectId,
    legacyManifestId,
    hostUri,
  }: {
    originalFullName: string | undefined;
    scheme: string | string[] | undefined;
    projectId: string | undefined;
    legacyManifestId?: string | undefined;
    hostUri?: string | undefined;
  }) {
    if (useNewManifest) {
      mockProperty(Constants.__rawManifest_TEST, 'metadata', {});
      mockProperty(Constants.__rawManifest_TEST, 'extra', {
        expoClient: {
          originalFullName,
          scheme,
          hostUri,
        },
        eas: {
          projectId,
        },
      });
    } else {
      mockProperty(Constants.__rawManifest_TEST, 'originalFullName', originalFullName);
      mockProperty(Constants.__rawManifest_TEST, 'scheme', scheme);
      mockProperty(Constants.__rawManifest_TEST, 'projectId', projectId);
      mockProperty(Constants.__rawManifest_TEST, 'id', legacyManifestId);
      mockProperty(Constants.__rawManifest_TEST, 'hostUri', hostUri);
    }
  }

  afterEach(() => {
    unmockAllProperties();
  });

  describe('getStartUrl', () => {
    beforeEach(() => {
      applyManifestMocks({
        originalFullName: '@example/abc',
        scheme: 'my-app',
        projectId: generatedProjectId,
        legacyManifestId: undefined,
      });
    });

    it(`returns the correct start URL from getStartUrl with useEASAuthSession = false`, () => {
      const authUrl = 'https://signin.com';
      const returnUrl = 'exp://expo.io/@example/abc+';
      const result = managedSessionUrlProvider.getStartUrl(false, authUrl, returnUrl);
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

    it(`returns the correct start URL from getStartUrl with useEASAuthSession = true`, () => {
      const authUrl = 'https://signin.com';
      const returnUrl = `exp://expo.io/fake+`;
      const result = managedSessionUrlProvider.getStartUrl(true, authUrl, returnUrl);
      expect(result).toEqual(
        Platform.select({
          default: `https://auth.expo.io/eas/${generatedProjectId}/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexpo.io%2Ffake%2B`,
          web: Platform.isDOMAvailable
            ? 'http://localhost/start?authUrl=https%3A%2F%2Fsignin.com&returnUrl=exp%3A%2F%2Fexpo.io%2Ffake%2B'
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
        });
        const originalWarn = console.warn;

        beforeEach(() => {
          console.warn = jest.fn();
        });
        afterEach(() => (console.warn = originalWarn));

        it(`checks return url`, () => {
          applyManifestMocks({
            originalFullName: '@example/abc',
            scheme: 'my-app',
            projectId: generatedProjectId,
          });

          expect(managedSessionUrlProvider.getRedirectUrl(false)).toEqual(
            Platform.select({
              default: 'https://auth.expo.io/@example/abc',
              web: Platform.isDOMAvailable ? 'http://localhost' : '',
            })
          );
          expect(managedSessionUrlProvider.getRedirectUrl(true)).toEqual(
            Platform.select({
              default: `https://auth.expo.io/eas/${generatedProjectId}`,
              web: Platform.isDOMAvailable ? 'http://localhost' : '',
            })
          );
        });

        if (Platform.OS !== 'web') {
          it(`throws a useful error if originalFullName and id are not defined and useEASAuthSession = false`, () => {
            applyManifestMocks({
              originalFullName: undefined,
              scheme: 'my-app',
              projectId: generatedProjectId,
              legacyManifestId: undefined,
            });

            const errorName = {
              [ExecutionEnvironment.StoreClient]:
                /Cannot use AuthSession proxy because the legacy project ID is not defined. Please report this as a bug/,
              [ExecutionEnvironment.Bare]:
                /Cannot use AuthSession proxy because the legacy project ID is not defined. Please ensure you have the latest/,
              [ExecutionEnvironment.Standalone]:
                /Cannot use AuthSession proxy because the legacy project ID is not defined./,
            };
            expect(() => managedSessionUrlProvider.getRedirectUrl(false)).toThrowError(
              errorName[execution]
            );
          });

          it(`throws a useful error if originalFullName and id are not defined and useEASAuthSession = true`, () => {
            applyManifestMocks({
              originalFullName: undefined,
              scheme: 'my-app',
              projectId: undefined,
              legacyManifestId: undefined,
            });

            const errorName = {
              [ExecutionEnvironment.StoreClient]:
                /Cannot use AuthSession proxy because the project ID is not defined. Please report this as a bug/,
              [ExecutionEnvironment.Bare]:
                /Cannot use AuthSession proxy because the project ID is not defined. Please ensure you have the latest/,
              [ExecutionEnvironment.Standalone]:
                /Cannot use AuthSession proxy because the project ID is not defined./,
            };
            expect(() => managedSessionUrlProvider.getRedirectUrl(true)).toThrowError(
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
        });
        it(`checks return url`, () => {
          applyManifestMocks({
            originalFullName: '@example/abc',
            scheme: 'my-app',
            projectId: generatedProjectId,
            hostUri: 'exp.host/@example/abc',
          });
          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'exp://exp.host/@example/abc/--/expo-auth-session'
          );
        });
        it(`checks return url with options`, () => {
          applyManifestMocks({
            originalFullName: '@example/abc',
            scheme: 'my-app',
            projectId: generatedProjectId,
            hostUri: 'exp.host/@example/abc',
          });
          const result = managedSessionUrlProvider.getDefaultReturnUrl('/foobar', {
            isTripleSlashed: true,
            scheme: 'foobar',
          });
          expect(result).toEqual('exp://exp.host/@example/abc/--/expo-auth-session/foobar');
        });
        it(`checks return url with multiple schemes and no default provided`, () => {
          applyManifestMocks({
            originalFullName: '@example/abc',
            scheme: ['my-app-1', 'my-app-2'],
            projectId: generatedProjectId,
            hostUri: 'exp.host/@test/test',
          });

          // Ensure no warning is thrown in store client
          expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
            'exp://exp.host/@test/test/--/expo-auth-session'
          );
        });
        it(`checks url with the release channel`, () => {
          applyManifestMocks({
            originalFullName: '@example/abc',
            scheme: 'my-app',
            projectId: generatedProjectId,
            hostUri: 'exp.host/@example/abc?release-channel=release-channel',
          });

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
          });
          const originalWarn = console.warn;

          beforeEach(() => {
            console.warn = jest.fn();
          });
          afterEach(() => (console.warn = originalWarn));

          it(`checks return url`, () => {
            applyManifestMocks({
              originalFullName: '@example/abc',
              scheme: 'my-app',
              projectId: generatedProjectId,
              hostUri: 'exp.host/@example/abc',
            });

            const result = managedSessionUrlProvider.getDefaultReturnUrl();

            expect(result).toEqual('my-app://expo-auth-session');
          });
          it(`throws if no scheme is defined`, () => {
            applyManifestMocks({
              originalFullName: '@example/abc',
              scheme: undefined,
              projectId: generatedProjectId,
            });

            expect(() => managedSessionUrlProvider.getDefaultReturnUrl()).toThrow(
              'Linking requires a build-time setting'
            );
          });
          it(`checks return url with options`, () => {
            applyManifestMocks({
              originalFullName: '@example/abc',
              scheme: 'my-app',
              projectId: generatedProjectId,
              hostUri: 'exp.host/@example/abc',
            });

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
            applyManifestMocks({
              originalFullName: '@example/abc',
              scheme: ['my-app-1', 'my-app-2'],
              projectId: generatedProjectId,
              hostUri: 'exp.host/@example/abc',
            });

            const result = managedSessionUrlProvider.getDefaultReturnUrl();
            // Ensure we silenced the warnings when multiple schemes can be found.
            expect(console.warn).not.toHaveBeenCalled();
            expect(result).toEqual('my-app-1://expo-auth-session');
          });

          it(`checks url with the release channel`, () => {
            applyManifestMocks({
              originalFullName: '@example/abc',
              scheme: 'my-app',
              projectId: generatedProjectId,
              hostUri: 'exp.host/@example/abc?release-channel=release-channel',
            });

            expect(managedSessionUrlProvider.getDefaultReturnUrl()).toEqual(
              'my-app://expo-auth-session?release-channel=release-channel'
            );
          });
        });
      }
    });
  }
});
