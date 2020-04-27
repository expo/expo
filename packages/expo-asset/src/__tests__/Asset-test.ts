jest.mock('expo-file-system', () => {
  const FileSystem = require.requireActual('expo-file-system');
  return {
    ...FileSystem,
    bundleDirectory: 'file:///Expo.app/',
    cacheDirectory: 'file:///Caches/Expo.app/',
    bundledAssets: ['asset_test1.png'],
    getInfoAsync: jest.fn(),
    downloadAsync: jest.fn(),
  };
});

jest.mock('react-native/Libraries/Image/AssetRegistry', () => {
  return {
    getAssetByID: jest.fn(),
  };
});

jest.mock('react-native/Libraries/Image/resolveAssetSource', () => {
  return {
    default: jest.fn(),
    setCustomSourceTransformer: jest.fn(),
  };
});

jest.mock('../ImageAssets', () => {
  const ImageAssets = require.requireActual('../ImageAssets');
  return {
    ...ImageAssets,
    getImageInfoAsync: jest.fn(),
  };
});

const mockImageMetadata = {
  name: 'test',
  type: 'png',
  hash: 'cafecafecafecafecafecafecafecafe',
  scales: [1],
  httpServerLocation: '/assets',
  fileHashes: ['cafecafecafecafecafecafecafecafe'],
};

afterEach(() => {
  jest.resetModules();
});

describe(`source resolution with React Native`, () => {
  it(`automatically registers a source resolver`, () => {
    require('../index');
    const {
      setCustomSourceTransformer,
    } = require('react-native/Libraries/Image/resolveAssetSource');
    expect(setCustomSourceTransformer).toHaveBeenCalledTimes(1);
  });
});

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

it(`creates assets from virtual modules`, () => {
  const { Asset } = require('../index');

  const { getAssetByID } = require('react-native/Libraries/Image/AssetRegistry');
  getAssetByID.mockReturnValueOnce(mockImageMetadata);

  const asset = Asset.fromModule(1);
  expect(asset.hash).toBe('cafecafecafecafecafecafecafecafe');
});

it(`throws when creating an asset from a missing module`, () => {
  const { Asset } = require('../index');

  const { getAssetByID } = require('react-native/Libraries/Image/AssetRegistry');
  getAssetByID.mockReturnValueOnce(undefined);

  expect(() => Asset.fromModule(2)).toThrowError();
});

it(`downloads uncached assets`, async () => {
  const FileSystem = require('expo-file-system');
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  expect(asset.localUri).toBeNull();

  FileSystem.getInfoAsync.mockReturnValueOnce({ exists: false });
  FileSystem.downloadAsync.mockReturnValueOnce({ md5: mockImageMetadata.hash });
  await asset.downloadAsync();

  expect(asset.downloading).toBe(false);
  expect(asset.downloaded).toBe(true);
  expect(asset.localUri).toBe(
    'file:///Caches/Expo.app/ExponentAsset-cafecafecafecafecafecafecafecafe.png'
  );
});

it(`throws when the file's checksum does not match`, async () => {
  const FileSystem = require('expo-file-system');
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  expect(asset.localUri).toBeNull();

  FileSystem.getInfoAsync.mockReturnValueOnce({ exists: false });
  FileSystem.downloadAsync.mockReturnValueOnce({ md5: 'deadf00ddeadf00ddeadf00ddeadf00d' });
  await expect(asset.downloadAsync()).rejects.toThrowError('failed MD5 integrity check');
});

it(`uses the local filesystem's cache directory for downloads`, async () => {
  const FileSystem = require('expo-file-system');
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  FileSystem.getInfoAsync.mockReturnValueOnce({
    exists: true,
    md5: mockImageMetadata.hash,
  });
  await asset.downloadAsync();
  expect(asset.downloaded).toBe(true);
  expect(FileSystem.downloadAsync).not.toHaveBeenCalled();
});

it(`coalesces downloads`, async () => {
  const FileSystem = require('expo-file-system');
  const { Asset } = require('../index');

  const asset = Asset.fromMetadata(mockImageMetadata);
  FileSystem.getInfoAsync.mockReturnValue({ exists: false });
  FileSystem.downloadAsync.mockReturnValue({ md5: mockImageMetadata.hash });

  await Promise.all([asset.downloadAsync(), asset.downloadAsync()]);
  expect(FileSystem.getInfoAsync).toHaveBeenCalledTimes(1);
  expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(1);
});

const { Platform } = require('@unimodules/core');
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
    jest.doMock('expo-constants', () => {
      const Constants = require.requireActual('expo-constants');
      return {
        ...Constants,
        appOwnership: 'standalone',
        manifest: {},
      };
    });
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
    expect(asset.localUri).toBe('file:///Expo.app/asset_test1.png');
  });
});
