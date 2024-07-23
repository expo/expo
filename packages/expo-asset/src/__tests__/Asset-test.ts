const { Platform } = jest.requireActual('expo-modules-core');

jest.mock('../PlatformUtils', () => ({
  ...jest.requireActual('../PlatformUtils'),
  getLocalAssets: () => {
    return {
      test1: 'file:///Expo.app/asset_test1.png',
    };
  },
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

jest.mock('../ExpoAsset', () => {
  const ExpoAsset = jest.requireActual('../ExpoAsset');
  return {
    ...ExpoAsset,
    downloadAsync: jest.fn(
      async () => 'file:///Caches/Expo.app/ExponentAsset-cafecafecafecafecafecafecafecafe.png'
    ),
  };
});

jest.mock('../ExpoAsset.web', () => {
  const ExpoAsset = jest.requireActual('../ExpoAsset.web');
  return {
    ...ExpoAsset,
    downloadAsync: jest.fn(async () => 'https://example.com/icon.png'),
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

it(`throws when creating an asset from a missing module`, () => {
  const { Asset } = require('../index');

  const { getAssetByID } = require('@react-native/assets-registry/registry');
  getAssetByID.mockReturnValueOnce(undefined);

  expect(() => Asset.fromModule(2)).toThrowError();
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

it(`uses the local file system's cache directory for downloads`, async () => {
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);

  await asset.downloadAsync();
  expect(asset.downloaded).toBe(true);
});

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
