import { getLocalAssetUri } from '../LocalAssets';

jest.mock('expo-constants', () => {
  const Constants = jest.requireActual('expo-constants');
  return {
    ...Constants,
    appOwnership: 'standalone',
  };
});

jest.mock('expo-file-system', () => {
  const FileSystem = jest.requireActual('expo-file-system');
  return {
    ...FileSystem,
    bundleDirectory:
      'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/',
    bundledAssets: ['asset_test1', 'asset_test2.png'],
  };
});

jest.mock('expo-modules-core', () => {
  const UnimodulesCore = jest.requireActual('expo-modules-core');
  return {
    ...UnimodulesCore,
    NativeModulesProxy: {
      ...UnimodulesCore.NativeModulesProxy,
      ExpoUpdates: {
        ...UnimodulesCore.NativeModulesProxy.ExpoUpdates,
        localAssets: {
          'test3.png':
            'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test3.png',
          'test4.':
            'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test4',
          'file-hash':
            'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/file-hash',
        },
      },
    },
  };
});

describe('getLocalAssetUri', () => {
  it(`returns null in __DEV__`, () => {
    const uri = getLocalAssetUri('hash', 'png');
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
      const uri = getLocalAssetUri('test3', 'png');
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test3.png'
      );
    });

    it(`returns a URI without a file extension if there is one, reqardless of whether an extension is specified`, () => {
      const uri = getLocalAssetUri('file-hash', 'jpg');
      const uri2 = getLocalAssetUri('file-hash', null);
      expect(uri).toBe(uri2);
      expect(uri2).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/file-hash'
      );
    });

    it(`returns a URI when an asset is bundled with a hash and no file extension`, () => {
      const uri = getLocalAssetUri('test4', null);
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test4'
      );
    });

    it(`returns a URI when an asset is bundled in the legacy location`, () => {
      const uri = getLocalAssetUri('test1', null);
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test1'
      );
    });

    it(`returns a URI for an asset with the given hash and file extension`, () => {
      const uri = getLocalAssetUri('test2', 'png');
      expect(uri).toBe(
        'file:///Containers/Bundle/Application/00A4A2F0-E268-40DC-A1AD-2F3A90BA2340/Expo.app/asset_test2.png'
      );
    });

    it(`returns null when no asset exists with the given hash and file extension`, () => {
      const uri1 = getLocalAssetUri('test1', 'png');
      expect(uri1).toBeNull();

      const uri2 = getLocalAssetUri('test2', 'xxx');
      expect(uri2).toBeNull();
    });
  });
});
