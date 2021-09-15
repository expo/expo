// import { makeRedirectUri } from '../AuthSession';

import { ExecutionEnvironment } from 'expo-constants';

function mockConstants(constants: { [key: string]: any } = {}): void {
  jest.doMock('expo-constants', () => {
    const ConstantsModule = jest.requireActual('expo-constants');
    const { default: Constants } = ConstantsModule;
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        ...Constants,
        ...constants,
        manifest: { ...Constants.manifest, ...(constants.manifest || {}) },
      },
    };
  });
}

function mockBareExecutionEnvironment(constants: { [key: string]: any } = {}): void {
  jest.doMock('expo-constants', () => {
    const ConstantsModule = jest.requireActual('expo-constants');
    const { default: Constants } = ConstantsModule;
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        executionEnvironment: ExecutionEnvironment.Bare,
        manifest: { ...Constants.manifest, ...(constants.manifest || {}) },
      },
    };
  });
}

describe('bare', () => {
  afterEach(() => {
    jest.resetModules();
  });
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = jest.fn();
    mockBareExecutionEnvironment();
  });
  afterEach(() => (console.warn = originalWarn));

  it(`throws if no scheme is provided or defined`, () => {
    const { makeRedirectUri } = require('../AuthSession');
    expect(() => makeRedirectUri()).toThrowError(/Linking requires a build-time /);
  });
  it(`uses native value`, () => {
    const { makeRedirectUri } = require('../AuthSession');
    // Test that the path is omitted
    expect(makeRedirectUri({ path: 'bacon', native: 'value:/somn' })).toBe('value:/somn');
  });
});
describe('Managed', () => {
  describe('Standalone', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it(`creates a redirect URL`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        appOwnership: 'standalone',
        executionEnvironment: ExecutionEnvironment.Standalone,
      });
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri()).toBe('demo://');
    });
    it(`creates a redirect URL with a custom path`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'standalone',
        executionEnvironment: ExecutionEnvironment.Standalone,
      });
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ path: 'bacon' })).toBe('demo://bacon');
    });

    it(`uses native instead of generating a value`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'standalone',
        executionEnvironment: ExecutionEnvironment.Standalone,
      });
      const { makeRedirectUri } = require('../AuthSession');
      expect(
        makeRedirectUri({
          native: 'native.thing://somn',
        })
      ).toBe('native.thing://somn');
    });
  });

  describe('Production', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it(`creates a redirect URL`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        appOwnership: 'expo',
        executionEnvironment: ExecutionEnvironment.StoreClient,
      });
      const { makeRedirectUri } = require('../AuthSession');

      expect(makeRedirectUri()).toBe('exp://exp.host/@test/test');
    });
    it(`creates a redirect URL with a custom path`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
          hostUri: 'exp.host/@test/test',
        },
        appOwnership: 'expo',
        executionEnvironment: ExecutionEnvironment.StoreClient,
      });

      const { makeRedirectUri } = require('../AuthSession');

      expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://exp.host/@test/test/--/bacon');
    });
  });

  describe('Development', () => {
    const devConstants = {
      linkingUri: 'exp://192.168.1.4:19000/',
      experienceUrl: 'exp://192.168.1.4:19000',
      appOwnership: 'expo',
      executionEnvironment: ExecutionEnvironment.StoreClient,
      manifest: {
        scheme: 'demo',
        hostUri: '192.168.1.4:19000',
        developer: {
          projectRoot: '/Users/person/myapp',
          tool: 'expo-cli',
        },
      },
    };
    afterEach(() => {
      jest.resetModules();
    });

    it(`creates a redirect URL`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri()).toBe('exp://192.168.1.4:19000');
    });
    it(`prefers localhost`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ preferLocalhost: true })).toBe('exp://localhost:19000');
    });
    it(`creates a redirect URL with a custom path`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://192.168.1.4:19000/--/bacon');
    });
  });

  describe('Proxy', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it(`creates a redirect URL with useProxy`, () => {
      const { makeRedirectUri } = require('../AuthSession');

      // Should create a proxy URL and omit the extra path component
      expect(makeRedirectUri({ path: 'bacon', useProxy: true })).toBe(
        'https://auth.expo.io/@test/originaltest'
      );
    });
  });
});
