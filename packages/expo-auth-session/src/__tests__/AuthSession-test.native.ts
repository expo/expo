// import { makeRedirectUri } from '../AuthSession';

function mockConstants(constants: { [key: string]: any } = {}): void {
  jest.doMock('expo-constants', () => {
    const Constants = require.requireActual('expo-constants').default;
    return {
      ...Constants,
      ...constants,
      manifest: { ...Constants.manifest, ...(constants.manifest || {}) },
    };
  });
}

function eraseConstants(): void {
  jest.doMock('expo-constants', () => {
    return {
      manifest: null,
    };
  });
}

describe('Bare', () => {
  afterEach(() => {
    jest.resetModules();
  });
  const originalWarn = console.warn;

  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => (console.warn = originalWarn));

  it(`Cannot create a URI automatically`, () => {
    eraseConstants();
    const { makeRedirectUri } = require('../AuthSession');
    expect(makeRedirectUri()).toBe('');
    expect(console.warn).toHaveBeenCalled();
  });
  it(`Use native value`, () => {
    eraseConstants();

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

    it(`Creates a redirect URL`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'standalone',
      });
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri()).toBe('demo://');
    });
    it(`Creates a redirect URL with a custom path`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'standalone',
      });
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ path: 'bacon' })).toBe('demo:///bacon');
    });

    it(`Uses native instead of generating a value`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'standalone',
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

    it(`Creates a redirect URL`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'expo',
      });
      const { makeRedirectUri } = require('../AuthSession');

      expect(makeRedirectUri()).toBe('exp://exp.host/@test/test');
    });
    it(`Creates a redirect URL with a custom path`, () => {
      mockConstants({
        linkingUri: 'exp://exp.host/@test/test',
        manifest: {
          scheme: 'demo',
        },
        appOwnership: 'expo',
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

    it(`Creates a redirect URL`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri()).toBe('exp://192.168.1.4:19000');
    });
    it(`Prefers localhost`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ preferLocalhost: true })).toBe('exp://localhost:19000');
    });
    it(`Creates a redirect URL with a custom path`, () => {
      mockConstants(devConstants);
      const { makeRedirectUri } = require('../AuthSession');
      expect(makeRedirectUri({ path: 'bacon' })).toBe('exp://192.168.1.4:19000/--/bacon');
    });
  });

  describe('Proxy', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it(`Creates a redirect URL with useProxy`, () => {
      const { makeRedirectUri } = require('../AuthSession');

      // Should create a proxy URL and omit the extra path component
      expect(makeRedirectUri({ path: 'bacon', useProxy: true })).toBe(
        'https://auth.expo.io/@test/test'
      );
    });
  });
});
