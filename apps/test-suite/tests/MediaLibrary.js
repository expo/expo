import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';

export const name = 'MediaLibrary';

export function requiresPermissions() {
  return [Permissions.CAMERA_ROLL];
}

export function canRunAsync({ isAutomated }) {
  return !isAutomated;
}

const FILES = [
  require('../assets/icons/app.png'),
  require('../assets/icons/loading.png'),
  require('../assets/black-128x256.png'),
  require('../assets/big_buck_bunny.mp4'),
];

const WAIT_TIME = 1000;
const IMG_NUMBER = 3;
const VIDEO_NUMBER = 1;
const F_SIZE = IMG_NUMBER + VIDEO_NUMBER;
const MEDIA_TYPES = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];
const DEFAULT_MEDIA_TYPES = [MediaLibrary.MediaType.photo];
const DEFAULT_PAGE_SIZE = 20;
const ASSET_KEYS = [
  'id',
  'filename',
  'uri',
  'mediaType',
  'width',
  'height',
  'creationTime',
  'modificationTime',
  'duration',
  Platform.OS === 'ios' ? 'mediaSubtypes' : 'albumId',
];

const INFO_KEYS = [
  'localUri',
  'location',
  'exif',
  ...(Platform !== 'ios' ? [] : ['orientation', 'isFavorite']),
];

const ALBUM_KEYS = [
  'id',
  'title',
  'assetCount',
  ...(Platform !== 'ios'
    ? []
    : ['type', 'startTime', 'endTime', 'approximateLocation', 'locationNames']),
];

const GET_ASSETS_KEYS = ['assets', 'endCursor', 'hasNextPage', 'totalCount'];
const ALBUM_NAME = 'Expo Test-Suite Album #1';
const SECOND_ALBUM_NAME = 'Expo Test-Suite Album #2';
const WRONG_NAME = 'wertyuiopdfghjklvbnhjnftyujn';
const WRONG_ID = '1234567890';

async function getFiles() {
  await Promise.all(FILES.map(req => Asset.loadAsync(req)));
  return FILES.map(file => Asset.fromModule(file));
}

async function getAssets(files) {
  return await Promise.all(files.map(({ localUri }) => MediaLibrary.createAssetAsync(localUri)));
}

async function createAlbum(assets, name) {
  const album = await MediaLibrary.createAlbumAsync(name, assets[0], false);
  await MediaLibrary.addAssetsToAlbumAsync(assets.slice(1), album, false);
  return album;
}

function timeoutWrapper(fun, time) {
  return new Promise(resolve => {
    setTimeout(() => {
      fun();
      resolve(null);
    }, time);
  });
}

export async function test({
  beforeAll,
  afterAll,
  describe,
  it,
  xit,
  xdescribe,
  beforeEach,
  jasmine,
  expect,
  ...t
}) {
  let testAssets;
  let album;
  let files;

  beforeAll(async () => {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);
    files = await getFiles();
    testAssets = await getAssets(files);
    album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
    if (album == null) album = await createAlbum(testAssets, ALBUM_NAME);
    else await MediaLibrary.addAssetsToAlbumAsync(testAssets, album, true);
  });

  afterAll(async () => {
    await MediaLibrary.deleteAssetsAsync(testAssets);
    await MediaLibrary.deleteAlbumsAsync(album);
  });

  describe('Every return value has proper shape', async () => {
    it('createAssetAsync', () => {
      const keys = Object.keys(testAssets[0]);
      ASSET_KEYS.forEach(key => expect(keys).toContain(key));
    });

    it('getAssetInfoAsync', async () => {
      const { assets } = await MediaLibrary.getAssetsAsync();
      const value = await MediaLibrary.getAssetInfoAsync(assets[0]);
      const keys = Object.keys(value);
      INFO_KEYS.forEach(key => expect(keys).toContain(key));
    });

    it('getAlbumAsync', async () => {
      const value = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      const keys = Object.keys(value);
      ALBUM_KEYS.forEach(key => expect(keys).toContain(key));
    });

    it('getAssetsAsync', async () => {
      const value = await MediaLibrary.getAssetsAsync();
      const keys = Object.keys(value);
      GET_ASSETS_KEYS.forEach(key => expect(keys).toContain(key));
    });
  });

  describe('Small tests', async () => {
    it('Function getAlbums returns test album', async () => {
      const albums = await MediaLibrary.getAlbumsAsync();
      expect(albums.filter(elem => elem.id === album.id).length).toBe(1);
    });

    it('getAlbum returns test album', async () => {
      const otherAlbum = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      expect(otherAlbum.title).toBe(album.title);
      expect(otherAlbum.id).toBe(album.id);
      expect(otherAlbum.assetCount).toBe(F_SIZE);
    });

    it('getAlbum with not existing album', async () => {
      const album = await MediaLibrary.getAlbumAsync(WRONG_NAME);
      expect(album).toBeNull();
    });

    it('getAssetInfo with not existing id', async () => {
      const asset = await MediaLibrary.getAssetInfoAsync(WRONG_ID);
      expect(asset).toBeNull();
    });

    // On both platforms assets should perserve their id. On iOS it's native behaviour,
    // but on Android it should be implemented (but it isn't)
    // it("After createAlbum and addAssetsTo album all assets have the same id", async () => {
    //   await Promise.all(testAssets.map(async asset => {
    //     const info = await MediaLibrary.getAssetInfoAsync(asset);
    //     expect(info.id).toBe(asset.id);
    //   }));
    // });
  });

  describe('getAssetsAsync', async () => {
    it('No arguments', async () => {
      const options = {};
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      expect(assets.length).toBeLessThanOrEqual(DEFAULT_PAGE_SIZE);
      expect(assets.length).toBeGreaterThanOrEqual(IMG_NUMBER);
      assets.forEach(asset => expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
    });

    it('album', async () => {
      const options = { album };
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      expect(assets.length).toBe(IMG_NUMBER);
      assets.forEach(asset => expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
      if (Platform.OS == 'android') assets.forEach(asset => expect(asset.albumId).toBe(album.id));
    });

    it('first, after', async () => {
      const options = { first: 2, album };
      {
        const { assets, endCursor, hasNextPage, totalCount } = await MediaLibrary.getAssetsAsync(
          options
        );
        expect(assets.length).toBe(2);
        expect(totalCount).toBe(IMG_NUMBER);
        expect(hasNextPage).toBeTruthy();
        assets.forEach(asset => expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
        options.after = endCursor;
      }
      {
        const { assets, hasNextPage, totalCount } = await MediaLibrary.getAssetsAsync(options);
        expect(assets.length).toBe(IMG_NUMBER - 2);
        expect(totalCount).toBe(IMG_NUMBER);
        expect(hasNextPage).toBeFalsy();
      }
    });

    it('mediaType: video', async () => {
      const mediaType = MediaLibrary.MediaType.video;
      const options = { mediaType, album };
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      assets.forEach(asset => expect(asset.mediaType).toBe(mediaType));
      expect(assets.length).toBe(1);
    });

    it('mediaType: photo', async () => {
      const mediaType = MediaLibrary.MediaType.photo;
      const options = { mediaType, album };
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      expect(assets.length).toBe(IMG_NUMBER);
      assets.forEach(asset => expect(asset.mediaType).toBe(mediaType));
    });

    it('check size - photo', async () => {
      const mediaType = MediaLibrary.MediaType.photo;
      const options = { mediaType, album };
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      expect(assets.length).toBe(IMG_NUMBER);
      assets.forEach(asset => {
        expect(asset.width).not.toEqual(0);
        expect(asset.height).not.toEqual(0);
      });
    });

    it('check size - video', async () => {
      const mediaType = MediaLibrary.MediaType.video;
      const options = { mediaType, album };
      const { assets } = await MediaLibrary.getAssetsAsync(options);
      expect(assets.length).toBe(VIDEO_NUMBER);
      assets.forEach(asset => {
        expect(asset.width).not.toEqual(0);
        expect(asset.height).not.toEqual(0);
      });
    });

    it('supports getting assets from specified time range', async () => {
      const assetsToCheck = 7;

      // Get some assets with the biggest creation time.
      const { assets } = await MediaLibrary.getAssetsAsync({
        first: assetsToCheck,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      // Set time range based on the newest and oldest creation times.
      const createdAfter = assets[assets.length - 1].creationTime;
      const createdBefore = assets[0].creationTime;

      // Repeat assets request but with the time range.
      const { assets: filteredAssets } = await MediaLibrary.getAssetsAsync({
        first: assetsToCheck,
        sortBy: MediaLibrary.SortBy.creationTime,
        createdAfter,
        createdBefore,
      });

      // We can't get more assets than previously, but they could be equal if there are multiple assets with the same timestamp.
      expect(filteredAssets.length).toBeLessThanOrEqual(assets.length);

      // Check if every asset was created within the time range.
      for (const asset of filteredAssets) {
        expect(asset.creationTime).toBeLessThanOrEqual(createdBefore);
        expect(asset.creationTime).toBeGreaterThanOrEqual(createdAfter);
      }
    });
  });

  describe('Delete tests', async () => {
    it('deleteAssetsAsync', async () => {
      const { assets } = await MediaLibrary.getAssetsAsync({ album, mediaType: MEDIA_TYPES });
      const result = await MediaLibrary.deleteAssetsAsync(assets.slice(0, 2));
      const { assets: rest } = await MediaLibrary.getAssetsAsync({
        album,
        mediaType: MEDIA_TYPES,
      });
      expect(result).toEqual(true);
      expect(rest.length).toBe(F_SIZE - 2);
    });
    it('deleteAlbumsAsync', async () => {
      const result = await MediaLibrary.deleteAlbumsAsync(album, true);
      expect(result).toEqual(true);
      album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      expect(album).toBeNull();
    });
    it('deleteManyAlbums', async () => {
      const assets = await getAssets(files.slice(0, 2));
      let firstAlbum = await MediaLibrary.createAlbumAsync(ALBUM_NAME, assets[0], false);
      let secondAlbum = await MediaLibrary.createAlbumAsync(SECOND_ALBUM_NAME, assets[1], false);
      await MediaLibrary.deleteAlbumsAsync([firstAlbum, secondAlbum], true);
      firstAlbum = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      secondAlbum = await MediaLibrary.getAlbumAsync(SECOND_ALBUM_NAME);
      const firstAsset = await MediaLibrary.getAssetInfoAsync(assets[0]);
      const secondAsset = await MediaLibrary.getAssetInfoAsync(assets[1]);
      expect(firstAlbum).toBeNull();
      expect(secondAlbum).toBeNull();
      expect(firstAsset).toBeNull();
      expect(secondAsset).toBeNull();
    });
  });

  describe('Listeners', async () => {
    it('addAsset calls listener', async () => {
      const spy = jasmine.createSpy('addAsset spy', () => {});
      const remove = MediaLibrary.addListener(spy);
      const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
      await timeoutWrapper(() => expect(spy).toHaveBeenCalled(), WAIT_TIME);
      remove.remove();
      await MediaLibrary.deleteAssetsAsync(asset);
    });

    it('remove listener', async () => {
      const spy = jasmine.createSpy('remove spy', () => {});
      const subscription = MediaLibrary.addListener(spy);
      subscription.remove();
      const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
      await MediaLibrary.deleteAssetsAsync(asset);
      await timeoutWrapper(() => expect(spy).not.toHaveBeenCalled(), WAIT_TIME);
    });

    it('deleteListener calls listener', async () => {
      const spy = jasmine.createSpy('deleteAsset spy', () => {});
      const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
      const subscription = MediaLibrary.addListener(spy);
      await MediaLibrary.deleteAssetsAsync(asset);
      await timeoutWrapper(() => expect(spy).toHaveBeenCalled(), WAIT_TIME);
      subscription.remove();
    });

    it('removeAllListeners', async () => {
      const spy = jasmine.createSpy('removeAll', () => {});
      MediaLibrary.addListener(spy);
      MediaLibrary.removeAllListeners();
      const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
      await timeoutWrapper(() => expect(spy).not.toHaveBeenCalled(), WAIT_TIME);
      await MediaLibrary.deleteAssetsAsync(asset);
    });
  });
}
