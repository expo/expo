import { AppOwnership, ExecutionEnvironment } from 'expo-constants';

import { describeManifest, mockConstants } from './ManifestTestUtils';

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

  describeManifest({ id: 'fake-uuid' })((manifestObj) => {
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
    describeManifest({
      extra: {
        expoClient: {
          name: 'wat',
          slug: 'wat',
          scheme: 'demo',
        },
      },
    })((manifestObj) => {
      it(`creates a redirect URL`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: null,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri()).toBe('demo://');
      });
    });

    describeManifest({
      extra: {
        expoClient: {
          name: 'wat',
          slug: 'wat',
          scheme: 'demo',
        },
      },
    })((manifestObj) => {
      it(`creates a redirect URL with a custom path`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: null,
            executionEnvironment: ExecutionEnvironment.Standalone,
          },
          manifestObj
        );
        const { makeRedirectUri } = require('../AuthSession');
        expect(makeRedirectUri({ path: 'bacon' })).toBe('demo://bacon');
      });
    });

    describeManifest({
      extra: {
        expoClient: {
          name: 'wat',
          slug: 'wat',
          scheme: 'demo',
        },
      },
    })((manifestObj) => {
      it(`uses native instead of generating a value`, () => {
        mockConstants(
          {
            linkingUri: 'exp://exp.host/@test/test',
            appOwnership: null,
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
      describeManifest({
        extra: {
          expoClient: {
            name: 'wat',
            slug: 'wat',
            scheme: 'demo',
          },
        },
      })((manifestObj) => {
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

      describeManifest({
        extra: {
          expoClient: {
            name: 'wat',
            slug: 'wat',
            scheme: 'demo',
          },
        },
      })((manifestObj) => {
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
      describeManifest({
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
      })((manifestObj) => {
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
  });
});
