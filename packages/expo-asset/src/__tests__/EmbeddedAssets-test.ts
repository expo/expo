import * as EmbeddedAssets from '../EmbeddedAssets';

jest.mock('expo-constants', () => {
  const Constants = require.requireActual('expo-constants');
  return {
    ...Constants,
    appOwnership: 'standalone',
  };
});

jest.mock('expo-file-system', () => {
  const FileSystem = require.requireActual('expo-file-system');
  return {
    ...FileSystem,
    bundleDirectory:
      'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/',
    bundledAssets: ['asset_test1', 'asset_test2.png'],
  };
});

describe('getEmbeddedAssetUri', () => {
  it(`returns null in __DEV__`, () => {
    let uri = EmbeddedAssets.getEmbeddedAssetUri('hash', 'png');
    expect(__DEV__).toBeTruthy();
    expect(uri).toBeNull();
  });

  describe('production', () => {
    beforeAll(() => {
      // @ts-ignore: the type declaration marks __DEV__ as read-only
      __DEV__ = false;
    });

    afterAll(() => {
      // @ts-ignore: the type declaration marks __DEV__ as read-only
      __DEV__ = true;
    });

    it(`returns a URI when an asset is bundled`, () => {
      let uri = EmbeddedAssets.getEmbeddedAssetUri('test1', null);
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test1'
      );
    });

    it(`returns a URI for an asset with the given hash and file extension`, () => {
      let uri = EmbeddedAssets.getEmbeddedAssetUri('test2', 'png');
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test2.png'
      );
    });

    it(`returns null when no asset exists with the given hash and file extension`, () => {
      let uri1 = EmbeddedAssets.getEmbeddedAssetUri('test1', 'png');
      expect(uri1).toBeNull();

      let uri2 = EmbeddedAssets.getEmbeddedAssetUri('test2', 'xxx');
      expect(uri2).toBeNull();
    });
  });
});
