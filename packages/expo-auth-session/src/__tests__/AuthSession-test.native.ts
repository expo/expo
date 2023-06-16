import { AppOwnership, ExecutionEnvironment } from 'expo-constants';

import { describeManifestTypes, mockConstants } from './ManifestTestUtils';

beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe('bare', () => {
  const originalWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => (console.warn = originalWarn));

  describeManifestTypes(
    { id: 'test' },
    { id: 'fake-uuid' }
  )((manifestObj) => {
    it(`throws if no scheme is provided or defined`, () => {
      mockConstants({ executionEnvironment: ExecutionEnvironment.Bare }, manifestObj);
      const { makeRedirectUri } = require('../AuthSession');
      expect(() => makeRedirectUri()).toThrowError(/Linking requires a build-time /);
    });
    it(`uses native value`, () => {
      mockConstants({ executionEnvironment: ExecutionEnvironment.Bare }, manifestObj);
      const { makeRedirectUri } = require('../AuthSession');
      // Test that the path is omitted
      expect(makeRedirectUri({ path: 'bacon', native: 'value:/somn' })).toBe('value:/somn');
    });
  });
});

describe('Managed', () => {
  describe('Standalone', () => {
    describeManifestTypes(
      {
        scheme: 'demo',
        hostUri: 'exp.host/@test/test',
      },
      {
        extra: {
          expoClient: {
            name: 'wat',
            slug: 'wat',
            scheme: 'demo',
          },
        },
      }
    )((manifestObj) => {
      it(`creates a redirect URL`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri()).toBe('demo://');
      });
    });

    describeManifestTypes(
      {
        scheme: 'demo',
      },
      {
        extra: {
          expoClient: {
            name: 'wat',
            slug: 'wat',
            scheme: 'demo',
          },
        },
      }
    )((manifestObj) => {
      it(`creates a redirect URL with a custom path`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri({ path: 'bacon' })).toBe('demo://bacon');
      });
    });

    describeManifestTypes(
      {
        scheme: 'demo',
      },
      {
        extra: {
          expoClient: {
            name: 'wat',
            slug: 'wat',
            scheme: 'demo',
          },
        },
      }
    )((manifestObj) => {
      it(`uses native instead of generating a value`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: AppOwnership.Standalone,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(
          makeRedirectUri({
            native: 'native.thing://somn',
          })
        ).toBe('native.thing://somn');
      });
    });

    describe('Production', () => {
      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'demo',
            },
          },
        }
      )((manifestObj) => {
        it(`creates a redirect URL`, () => {
          mockConstants(
            {
              linkingUri: 'exp://exp.host/@test/test',
              appOwnership: AppOwnership.Expo,
              executionEnvironment: ExecutionEnvironment.StoreClient,
            },
            manifestObj
          );
          const { makeRedirectUri } = require('../AuthSession');

          expect(makeRedirectUri()).toBe('exp://exp.host/@test/test');
        });
      });

      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'demo',
            },
          },
        }
      )((manifestObj) => {
        it(`creates a redirect URL with a custom path`, () => {
          mockConstants(
            {
              linkingUri: 'exp://exp.host/@test/test',
              appOwnership: AppOwnership.Expo,
              executionEnvironment: ExecutionEnvironment.StoreClient,
            },
            manifestObj
          );

          const { makeRedirectUri } = require('../AuthSession');

          expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://exp.host/@test/test/--/bacon');
        });
      });
    });

    describe('Development', () => {
      describeManifestTypes(
        {
          scheme: 'demo',
          hostUri: '192.168.1.4:8081',
          developer: {
            projectRoot: '/Users/person/myapp',
            tool: 'expo-cli',
          },
        },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              scheme: 'demo',
              hostUri: '192.168.1.4:8081',
            },
            expoGo: {
              developer: {
                projectRoot: '/Users/person/myapp',
                tool: 'expo-cli',
              },
            },
          },
        }
      )((manifestObj) => {
        const devConstants = {
          linkingUri: 'exp://192.168.1.4:8081/',
          experienceUrl: 'exp://192.168.1.4:8081',
          appOwnership: AppOwnership.Expo,
          executionEnvironment: ExecutionEnvironment.StoreClient,
        };

        it(`creates a redirect URL`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri()).toBe('exp://192.168.1.4:8081');
        });
        it(`prefers localhost`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri({ preferLocalhost: true })).toBe('exp://localhost:8081');
        });
        it(`creates a redirect URL with a custom path`, () => {
          mockConstants(devConstants, manifestObj);
          const { makeRedirectUri } = require('../AuthSession');
          expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://192.168.1.4:8081/--/bacon');
        });
      });
    });

    describe('Proxy', () => {
      describeManifestTypes(
        {
          id: 'fake',
          originalFullName: '@test/originaltest',
        },
        {
          extra: {
            expoClient: {
              name: 'wat',
              slug: 'wat',
              originalFullName: '@test/originaltest',
            },
          },
        }
      )((manifestObj) => {
        it(`creates a redirect URL with useProxy`, () => {
          mockConstants({}, manifestObj);

          const { makeRedirectUri } = require('../AuthSession');

          // Should create a proxy URL and omit the extra path component
          expect(makeRedirectUri({ path: 'bacon', useProxy: true })).toBe(
            'https://auth.expo.io/@test/originaltest'
          );
        });
      });
    });
  });
});
