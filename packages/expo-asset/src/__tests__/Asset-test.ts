const { Platform } = jest.requireActual('expo-modules-core');

jest.mock('../PlatformUtils', () => ({
  ...jest.requireActual('../PlatformUtils'),
  getLocalAssets: jest.fn(() => ({
    test1: 'file:///Expo.app/asset_test1.png',
    androidResTest1: 'file:///android_res/drawable/test.png',
  })),
}));

jest.mock('@react-native/assets-registry/registry', () => ({
  getAssetByID: jest.fn(),
}));

jest.mock('react-native/Libraries/Image/resolveAssetSource', () => {
  return {
    default: jest.fn(),
    setCustomSourceTransformer: jest.fn(),
  };
});

const mockAssetBytes = new Uint8Array([1, 2, 3]);

jest.mock('../ExpoAsset', () => {
  const ExpoAsset = jest.requireActual('../ExpoAsset');
  return {
    ...ExpoAsset,
    downloadAsync: jest.fn(
      async () => 'file:///Caches/Expo.app/ExponentAsset-cafecafecafecafecafecafecafecafe.png'
    ),
    bytes: jest.fn(async () => mockAssetBytes),
  };
});

jest.mock('../ExpoAsset.web', () => {
  const ExpoAsset = jest.requireActual('../ExpoAsset.web');
  return {
    ...ExpoAsset,
    downloadAsync: jest.fn(async () => 'https://example.com/icon.png'),
    bytes: jest.fn(async () => {
      throw new Error('Test');
    }),
  };
});

jest.mock('../ImageAssets', () => {
  const ImageAssets = jest.requireActual('../ImageAssets');
  return {
    ...ImageAssets,
    getImageInfoAsync: jest.fn(async () => ({ width: 1, height: 1 })),
  };
});

const mockImageMetadata = {
  name: 'test',
  type: 'png',
  uri: 'https://example.com/icon.png',
  hash: 'cafecafecafecafecafecafecafecafe',
  scales: [1],
  httpServerLocation: '/assets',
  fileUris: ['https://example.com/icon.png'],
  fileHashes: ['cafecafecafecafecafecafecafecafe'],
};

afterEach(() => {
  jest.resetModules();
});

if (Platform.OS !== 'web') {
  describe(`source resolution with React Native`, () => {
    jest.doMock('expo-constants', () => {
      const Constants = jest.requireActual('expo-constants');
      return {
        ...Constants,
        appOwnership: Constants.AppOwnership.Expo,
      };
    });

    it(`automatically registers a source resolver`, () => {
      require('../index');
      const {
        setCustomSourceTransformer,
      } = require('react-native/Libraries/Image/resolveAssetSource');
      expect(setCustomSourceTransformer).toHaveBeenCalledTimes(1);
    });
  });
}

it(`creates assets from metadata`, () => {
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  expect(asset.hash).toBe('cafecafecafecafecafecafecafecafe');
});

it(`interns assets by hash`, () => {
  const { Asset } = require('../index');

  const asset1 = Asset.fromMetadata(mockImageMetadata);
  const asset2 = Asset.fromMetadata(mockImageMetadata);
  expect(asset1).toBe(asset2);
});

it(`creates assets from URIs`, () => {
  const { Asset } = require('../index');

  const asset = Asset.fromURI('https://example.com/image.png');
  expect(asset.uri).toBe('https://example.com/image.png');
  expect(asset.type).toBe('png');
  expect(asset.hash).toBeNull();
});

it(`creates assets from data URIs`, () => {
  const { Asset } = require('../index');

  const asset = Asset.fromURI('data:text/html;base64,dGVzdA%3D%3D');
  expect(asset.type).toBe('html');
});

it.skip(`supports non-Base64 data URIs`, () => {
  const { Asset } = require('../index');

  const asset = Asset.fromURI('data:,test');
  expect(asset.type).toBe('txt');
});

it(`interns assets by URI`, () => {
  const { Asset } = require('../index');

  const uri = 'data:,Hello%2C%20World!';
  const asset1 = Asset.fromURI(uri);
  const asset2 = Asset.fromURI(uri);
  expect(asset1).toBe(asset2);
});

if (Platform.OS !== 'web') {
  it(`creates assets from virtual modules`, () => {
    const { Asset } = require('../index');

    const { getAssetByID } = require('@react-native/assets-registry/registry');
    getAssetByID.mockReturnValueOnce(mockImageMetadata);

    const asset = Asset.fromModule(1);
    expect(asset.hash).toBe('cafecafecafecafecafecafecafecafe');
  });
}

it(`can parse object asset`, () => {
  const { Asset } = require('../index');

  expect(
    Asset.fromModule({
      uri: 'https://example.com/icon.png',
      width: 1,
      height: 1,
    })
  ).toBeDefined();
});

it(`throws when creating an asset from a missing module`, () => {
  const { Asset } = require('../index');

  const { getAssetByID } = require('@react-native/assets-registry/registry');
  getAssetByID.mockReturnValueOnce(undefined);

  expect(() => Asset.fromModule(2)).toThrow();
});

it(`downloads uncached assets`, async () => {
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  expect(asset.localUri).toBeNull();

  await asset.downloadAsync();

  expect(asset.downloading).toBe(false);
  expect(asset.downloaded).toBe(true);
  expect(asset.localUri).toBe(
    Platform.select({
      web: 'https://example.com/icon.png',
      default: 'file:///Caches/Expo.app/ExponentAsset-cafecafecafecafecafecafecafecafe.png',
    })
  );
});

describe('Asset contents', () => {
  describe('bytes', () => {
    if (Platform.OS === 'android') {
      describe('android', () => {
        it('receives uint8array of asset', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          await expect(asset.bytes()).resolves.toEqual(mockAssetBytes);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });
      });
    }

    if (Platform.OS === 'web') {
      if (!globalThis.fetch) {
        globalThis.fetch = async () => null as unknown as Response;
      }

      describe('web', () => {
        beforeEach(() => {
          jest.spyOn(globalThis, 'fetch');
        });

        afterEach(() => {
          (globalThis.fetch as jest.Mock).mockRestore();
        });

        it('receives uint8array of asset', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            statusText: '',
            text: async () => null,
            arrayBuffer: async () => mockAssetBytes.buffer,
          });

          await expect(asset.bytes()).resolves.toEqual(mockAssetBytes);

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });

        it('throws server error during request of asset bytes', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Data not found on server',
            arrayBuffer: async () => null,
          });

          await expect(() => asset.bytes()).rejects.toThrow(
            `File "${mockImageMetadata.uri}" not fetched: Not Found (404): Data not found on server`
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });

        it('throws network error during request of asset bytes', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

          await expect(() => asset.bytes()).rejects.toThrow('Network error');

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });
      });
    }
  });

  describe('arrayBuffer', () => {
    if (Platform.OS === 'android') {
      describe('android', () => {
        it('receives arrayBuffer of asset', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          await expect(asset.arrayBuffer()).resolves.toEqual(mockAssetBytes.buffer);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });
      });
    }

    if (Platform.OS === 'web') {
      if (!globalThis.fetch) {
        globalThis.fetch = async () => null as unknown as Response;
      }

      describe('web', () => {
        beforeEach(() => {
          jest.spyOn(globalThis, 'fetch');
        });

        afterEach(() => {
          (globalThis.fetch as jest.Mock).mockRestore();
        });

        it('receives arrayBuffer of asset', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            statusText: '',
            text: async () => null,
            arrayBuffer: async () => mockAssetBytes.buffer,
          });

          await expect(asset.arrayBuffer()).resolves.toEqual(mockAssetBytes.buffer);

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });

        it('throws server error during request of asset arrayBuffer', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Data not found on server',
            arrayBuffer: async () => null,
          });

          await expect(() => asset.arrayBuffer()).rejects.toThrow(
            `File "${mockImageMetadata.uri}" not fetched: Not Found (404): Data not found on server`
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });

        it('throws network error during request of asset arrayBuffer', async () => {
          const { Asset } = require('../index');

          const asset = Asset.fromMetadata(mockImageMetadata);

          (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

          await expect(() => asset.arrayBuffer()).rejects.toThrow('Network error');

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);

          expect(asset.localUri).toBeNull();
          expect(asset.downloading).toBe(false);
          expect(asset.downloaded).toBe(false);
        });
      });
    }
  });

  describe('content', () => {
    if (Platform.OS === 'android') {
      describe('android', () => {
        it('receives content as uint8array of asset', async () => {
          const { Asset } = require('../index');

          await expect(Asset.content(mockImageMetadata)).resolves.toEqual(mockAssetBytes);
        });
      });
    }

    if (Platform.OS === 'web') {
      if (!globalThis.fetch) {
        globalThis.fetch = async () => null as unknown as Response;
      }

      describe('web', () => {
        beforeEach(() => {
          jest.spyOn(globalThis, 'fetch');
        });

        afterEach(() => {
          (globalThis.fetch as jest.Mock).mockRestore();
        });

        it('receives content as uint8array of asset', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            statusText: '',
            text: async () => null,
            arrayBuffer: async () => mockAssetBytes.buffer,
          });

          await expect(Asset.content(mockImageMetadata)).resolves.toEqual(mockAssetBytes);

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });

        it('throws server error during request of asset bytes', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Data not found on server',
            arrayBuffer: async () => null,
          });

          await expect(() => Asset.content(mockImageMetadata)).rejects.toThrow(
            `File "${mockImageMetadata.uri}" not fetched: Not Found (404): Data not found on server`
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });

        it('throws network error during request of asset bytes', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

          await expect(() => Asset.content(mockImageMetadata)).rejects.toThrow('Network error');

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });
      });
    }
  });

  describe('contentArrayBuffer', () => {
    if (Platform.OS === 'android') {
      describe('android', () => {
        it('receives content as ArrayBuffer of asset', async () => {
          const { Asset } = require('../index');

          await expect(Asset.contentArrayBuffer(mockImageMetadata)).resolves.toEqual(
            mockAssetBytes.buffer
          );
        });
      });
    }

    if (Platform.OS === 'web') {
      if (!globalThis.fetch) {
        globalThis.fetch = async () => null as unknown as Response;
      }

      describe('web', () => {
        beforeEach(() => {
          jest.spyOn(globalThis, 'fetch');
        });

        afterEach(() => {
          (globalThis.fetch as jest.Mock).mockRestore();
        });

        it('receives content as ArrayBuffer of asset', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            statusText: '',
            text: async () => null,
            arrayBuffer: async () => mockAssetBytes.buffer,
          });

          await expect(Asset.contentArrayBuffer(mockImageMetadata)).resolves.toEqual(
            mockAssetBytes.buffer
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });

        it('throws server error during request of asset ArrayBuffer', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            text: async () => 'Data not found on server',
            arrayBuffer: async () => null,
          });

          await expect(() => Asset.contentArrayBuffer(mockImageMetadata)).rejects.toThrow(
            `File "${mockImageMetadata.uri}" not fetched: Not Found (404): Data not found on server`
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });

        it('throws network error during request of asset ArrayBuffer', async () => {
          const { Asset } = require('../index');

          (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

          await expect(() => Asset.contentArrayBuffer(mockImageMetadata)).rejects.toThrow(
            'Network error'
          );

          expect(fetch).toHaveBeenCalledWith(mockImageMetadata.uri);
        });
      });
    }
  });
});

it(`uses the local file system's cache directory for downloads`, async () => {
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);

  await asset.downloadAsync();
  expect(asset.downloaded).toBe(true);
});

if (Platform.OS === 'android') {
  it('should support file:///android_res/drawable/test.png', async () => {
    const { Asset } = require('../index');

    const asset = Asset.fromMetadata({
      name: 'androidResTest1',
      type: 'png',
      scales: [1],
      httpServerLocation: '/assets',
      hash: 'androidResTest1',
      fileHashes: ['androidResTest1'],
    });
    // We treat file:///android_res/ assets as not downloaded
    expect(asset.localUri).toBe(null);
    expect(asset.downloaded).toBeFalsy();
    expect(asset.uri).toBe('file:///android_res/drawable/test.png');

    await asset.downloadAsync();
    const ExpoAsset = jest.requireMock('../ExpoAsset');
    expect(ExpoAsset.downloadAsync).toHaveBeenCalledTimes(1);
    expect(asset.downloaded).toBe(true);
    expect(asset.localUri).toBeTruthy();
  });
}

if (Platform.OS !== 'web') {
  it(`coalesces downloads`, async () => {
    const { Asset } = require('../index');

    const asset = Asset.fromMetadata(mockImageMetadata);

    await Promise.all([asset.downloadAsync(), asset.downloadAsync()]);
    const ExpoAsset = jest.requireMock('../ExpoAsset');
    expect(ExpoAsset.downloadAsync).toHaveBeenCalledTimes(1);
  });
}

if (Platform.OS === 'web') {
  describe('web', () => {
    it(`fetches images to determine the dimensions`, async () => {
      const ImageAssets = require('../ImageAssets');
      const { Asset } = require('../index');

      const asset = Asset.fromMetadata(mockImageMetadata);
      ImageAssets.getImageInfoAsync.mockResolvedValueOnce({
        width: 120,
        height: 180,
        name: 'test',
      });
      await asset.downloadAsync();

      expect(asset.width).toBe(120);
      expect(asset.height).toBe(180);
      expect(asset.downloaded).toBe(true);
      expect(asset.localUri).toBe(asset.uri);
    });
  });
}

describe('embedding', () => {
  beforeAll(() => {
    // @ts-ignore: the type declaration marks __DEV__ as read-only
    __DEV__ = false;
  });

  afterAll(() => {
    jest.dontMock('expo-constants');
    // @ts-ignore: the type declaration marks __DEV__ as read-only
    __DEV__ = true;
  });

  it(`considers embedded assets to be downloaded`, () => {
    const { Asset } = require('../index');

    const asset = Asset.fromMetadata({
      ...mockImageMetadata,
      hash: 'test1',
      type: 'png',
      fileHashes: ['test1'],
    });
    expect(asset.localUri).toBe(
      Platform.select({
        web: null,
        default: 'file:///Expo.app/asset_test1.png',
      })
    );
  });
});
