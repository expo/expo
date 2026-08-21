import { Platform } from 'expo-modules-core';

jest.mock('expo/internal/bundle-origin', () => ({ getBundleOrigin: jest.fn(() => null) }));

const mockFontMetadata = {
  hash: 'cafecafecafecafecafecafecafecafe',
  name: 'test',
  type: 'ttf',
  scales: [1],
  httpServerLocation: '/assets',
};
const mockFontMonorepoMetadata = {
  hash: 'cafecafecafecafecafecafecafecafe',
  name: 'test',
  type: 'ttf',
  scales: [1],
  httpServerLocation: '/assets/?unstable_path=.',
};

describe('selectAssetSource', () => {
  beforeEach(() => {
    _mockDevServerUrl(null);
    _mockConstants({
      experienceUrl: 'https://example.com/app/expo-manifest.json',
      __unsafeNoWarnManifest2: {},
    });
  });

  afterEach(() => {
    jest.resetModules();
  });

  it(`returns an asset source object with an invalid dummy remote URL if the asset metadata does not specify an absolute URL in production`, () => {
    const AssetSources = require('../AssetSources');
    expect(AssetSources.selectAssetSource(mockFontMetadata)).toEqual({
      hash: 'cafecafecafecafecafecafecafecafe',
      uri: '',
    });
  });

  if (Platform.OS !== 'web') {
    it(`returns a manifest2 URI with http:// when experienceUrl uses http:// scheme`, () => {
      _mockConstants({
        experienceUrl: 'http://127.0.0.1:8081/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: {
                tool: 'expo-cli',
              },
              debuggerHost: '127.0.0.1:8081',
            },
          },
        },
      });

      const AssetSources = require('../AssetSources');
      const source = AssetSources.selectAssetSource(mockFontMetadata);

      expect(source.uri).toBe(
        `http://127.0.0.1:8081/assets/test.ttf?platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
      expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
    });

    it(`returns a manifest2 URI with https:// when experienceUrl uses exps:// scheme`, () => {
      _mockConstants({
        experienceUrl: 'exps://example.com/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: {
                tool: 'expo-cli',
              },
              debuggerHost: 'example.com:8081',
            },
          },
        },
      });

      const AssetSources = require('../AssetSources');
      const source = AssetSources.selectAssetSource(mockFontMetadata);

      expect(source.uri).toBe(
        `https://example.com:8081/assets/test.ttf?platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
      expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
    });
  }

  it(`returns a file URI from the asset metadata if specified`, () => {
    const AssetSources = require('../AssetSources');

    const source = AssetSources.selectAssetSource({
      ...mockFontMetadata,
      fileUris: ['https://example.com/example.ttf'],
    });

    expect(source.uri).toBe('https://example.com/example.ttf');
    expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
  });

  it(`returns a URI based on an absolute server location if specified`, () => {
    const AssetSources = require('../AssetSources');

    const source = AssetSources.selectAssetSource({
      ...mockFontMetadata,
      httpServerLocation: 'https://example.com',
    });

    expect(source.uri).toBe(
      `https://example.com/test.ttf?platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
    );
    expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
  });

  it(`chooses the image with the best scale`, () => {
    // The mocked pixel ratio is from a retina device or higher

    const AssetSources = require('../AssetSources');

    const source = AssetSources.selectAssetSource({
      hash: 'cafecafecafecafecafecafecafecafe',
      name: 'test',
      type: 'png',
      scales: [1, 2, 100],
      fileUris: [
        'https://example.com/icon.png',
        'https://example.com/icon@2x.png',
        'https://example.com/icon@100x.png',
      ],
      fileHashes: [
        'facefacefacefacefacefacefaceface',
        'c0dec0dec0dec0dec0dec0dec0dec0de',
        'babebabebabebabebabebabebabebabe',
      ],
      httpServerLocation: '/assets',
    });

    const uri = Platform.select({
      web: 'https://example.com/icon.png',
      default: 'https://example.com/icon@2x.png',
    });
    const hash = Platform.select({
      web: 'facefacefacefacefacefacefaceface',
      default: 'c0dec0dec0dec0dec0dec0dec0dec0de',
    });

    expect(source.uri).toBe(uri);
    expect(source.hash).toBe(hash);
  });

  if (Platform.OS !== 'web') {
    it(`returns a development URI with http:// using non-standard path`, () => {
      _mockConstants({
        experienceUrl: 'http://127.0.0.1:8081/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: {
                tool: 'expo-cli',
              },
              debuggerHost: '127.0.0.1:8081',
            },
          },
        },
      });

      const AssetSources = require('../AssetSources');

      const source = AssetSources.selectAssetSource(mockFontMonorepoMetadata);
      expect(source.uri).toBe(
        `http://127.0.0.1:8081/assets/?unstable_path=.%2Ftest.ttf&platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
      expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
    });

    it(`returns a development URI with https:// using non-standard path when experienceUrl uses exps://`, () => {
      _mockConstants({
        experienceUrl: 'exps://example.com/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: {
                tool: 'expo-cli',
              },
              debuggerHost: 'example.com:8081',
            },
          },
        },
      });

      const AssetSources = require('../AssetSources');

      const source = AssetSources.selectAssetSource(mockFontMonorepoMetadata);
      expect(source.uri).toBe(
        `https://example.com:8081/assets/?unstable_path=.%2Ftest.ttf&platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
      expect(source.hash).toBe('cafecafecafecafecafecafecafecafe');
    });

    it(`returns a development URI from the bundle URL rather than debuggerHost`, () => {
      // The dev server may be reached through an address it can't observe itself, so the URL the
      // bundle was loaded from wins over `debuggerHost`, which may name an unreachable address.
      _mockConstants({
        experienceUrl: 'https://proxy.test/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: { tool: 'expo-cli' },
              debuggerHost: '127.0.0.1:8081',
            },
          },
        },
      });
      _mockDevServerUrl('https://proxy.test/');

      const AssetSources = require('../AssetSources');
      const source = AssetSources.selectAssetSource(mockFontMetadata);

      expect(source.uri).toBe(
        `https://proxy.test/assets/test.ttf?platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
    });

    it(`keeps the bundle URL's port`, () => {
      _mockConstants({
        experienceUrl: 'http://proxy.test:4443/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: { tool: 'expo-cli' },
              debuggerHost: '127.0.0.1:8081',
            },
          },
        },
      });
      _mockDevServerUrl('http://proxy.test:4443/');

      const AssetSources = require('../AssetSources');

      expect(AssetSources.selectAssetSource(mockFontMonorepoMetadata).uri).toBe(
        `http://proxy.test:4443/assets/?unstable_path=.%2Ftest.ttf&platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
    });

    it(`falls back to debuggerHost when the bundle wasn't loaded from a server`, () => {
      _mockConstants({
        experienceUrl: 'http://127.0.0.1:8081/app',
        __unsafeNoWarnManifest2: {
          extra: {
            expoGo: {
              developer: { tool: 'expo-cli' },
              debuggerHost: '127.0.0.1:8081',
            },
          },
        },
      });
      _mockDevServerUrl(null);

      const AssetSources = require('../AssetSources');

      expect(AssetSources.selectAssetSource(mockFontMetadata).uri).toBe(
        `http://127.0.0.1:8081/assets/test.ttf?platform=${Platform.OS}&hash=cafecafecafecafecafecafecafecafe`
      );
    });

    it(`ignores the bundle URL for a published app in Expo Go`, () => {
      // Without a dev server in the manifest the bundle came from a CDN, and assets must not be
      // resolved against it.
      _mockConstants({
        experienceUrl: 'https://exp.host/@test/test',
        __unsafeNoWarnManifest2: { extra: {} },
      });
      _mockDevServerUrl('https://cdn.test/');

      const AssetSources = require('../AssetSources');

      expect(AssetSources.selectAssetSource(mockFontMetadata).uri).toBe('');
    });
  }
});

if (Platform.OS !== 'web') {
  describe('resolveUri', () => {
    beforeAll(() => {
      jest.resetModules();
    });
    afterEach(() => {
      jest.resetModules();
    });

    it(`returns URLs as-is when there is no base URL`, () => {
      _mockConstants({});
      const Constants = require('expo-constants');
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('./icon.png');
      expect(Constants.experienceUrl).not.toBeDefined();
      expect(url).toBe('./icon.png');
    });

    it(`returns absolute URLs as-is`, () => {
      _mockConstants({ experienceUrl: 'https://example.com/app/expo-manifest.json' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('https://example.com/icon.png?q=1#hash');
      expect(url).toBe('https://example.com/icon.png?q=1#hash');
    });

    it(`resolves URLs relative to the manifest's base URL`, () => {
      _mockConstants({ experienceUrl: 'https://expo.io/@user/app/index.exp' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('./icon.png');
      expect(url).toBe('https://expo.io/@user/app/icon.png');
    });

    it(`resolves . and .. in URLs`, () => {
      _mockConstants({ experienceUrl: 'https://example.com/app/expo-manifest.json' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('.././test/../icon.png');
      expect(url).toBe('https://example.com/icon.png');
    });

    it(`is resilient against extra .. in URLs`, () => {
      _mockConstants({ experienceUrl: 'https://example.com/app/expo-manifest.json' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('../../../../../icon.png');
      expect(url).toBe('https://example.com/icon.png');
    });

    it(`resolves URLs starting with / relative to the domain root`, () => {
      _mockConstants({ experienceUrl: 'https://example.com/app/expo-manifest.json' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('/icon.png');
      expect(url).toBe('https://example.com/icon.png');
    });

    it(`preserves query parameters and fragments`, () => {
      _mockConstants({ experienceUrl: 'https://example.com/app/expo-manifest.json' });
      const AssetSources = require('../AssetSources');

      const url = AssetSources.resolveUri('./icon.png?q=1#hash');
      expect(url).toBe('https://example.com/app/icon.png?q=1#hash');
    });
  });
}

function _mockConstants(constants: { [key: string]: any }): void {
  jest.doMock('expo-constants', () => {
    const Constants = jest.requireActual('expo-constants');
    return {
      ...Constants,
      ...constants,
      manifest: { ...Constants.manifest, ...constants.manifest },
    };
  });
}

/** Mock the origin the running bundle was loaded from. */
function _mockDevServerUrl(origin: string | null): void {
  jest.mocked(require('expo/internal/bundle-origin').getBundleOrigin).mockReturnValue(origin);
}
