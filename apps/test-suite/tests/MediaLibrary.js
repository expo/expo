import { Asset, Permissions, MediaLibrary } from 'expo';
import { Platform } from 'react-native';

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
  Platform.OS == 'ios' ? 'mediaSubtypes' : 'albumId',
];

const INFO_KEYS = [
  'localUri',
  'location',
  'exif',
  ...(Platform != 'ios' ? [] : ['orientation', 'isFavorite']),
];

const ALBUM_KEYS = [
  'id',
  'title',
  'assetCount',
  ...(Platform != 'ios'
    ? []
    : ['type', 'startTime', 'endTime', 'approximateLocation', 'locationNames']),
];

const GET_ASSETS_KEYS = ['assets', 'endCursor', 'hasNextPage', 'totalCount'];
const ALBUM_NAME = '__tseTyrarbiLaidem__';
const WRONG_NAME = 'wertyuiopdfghjklvbnhjnftyujn';
const FIRST_ALBUM = '__iosTestAlbum__';
const SECOND_ALBUM = '__mublAtseTsoi__';
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

export async function test(t) {
  t.describe('MediaLibrary', async () => {
    let testAssets;
    let album;
    let files;

    t.beforeAll(async () => {
      await Permissions.askAsync(Permissions.CAMERA_ROLL);
      files = await getFiles();
      testAssets = await getAssets(files);
      album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (album == null) album = await createAlbum(testAssets, ALBUM_NAME);
      else await MediaLibrary.addAssetsToAlbumAsync(testAssets, album, true);
    });

    t.describe('Every return value has proper shape', async () => {
      t.it('createAssetAsync', () => {
        const keys = Object.keys(testAssets[0]);
        ASSET_KEYS.forEach(key => t.expect(keys).toContain(key));
      });

      t.it('getAssetInfoAsync', async () => {
        const { assets } = await MediaLibrary.getAssetsAsync();
        const value = await MediaLibrary.getAssetInfoAsync(assets[0]);
        const keys = Object.keys(value);
        INFO_KEYS.forEach(key => t.expect(keys).toContain(key));
      });

      t.it('getAlbumAsync', async () => {
        const value = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        const keys = Object.keys(value);
        ALBUM_KEYS.forEach(key => t.expect(keys).toContain(key));
      });

      t.it('getAssetsAsync', async () => {
        const value = await MediaLibrary.getAssetsAsync();
        const keys = Object.keys(value);
        GET_ASSETS_KEYS.forEach(key => t.expect(keys).toContain(key));
      });
    });

    t.describe('Small tests', async () => {
      t.it('Function getAlbums returns test album', async () => {
        const albums = await MediaLibrary.getAlbumsAsync();
        t.expect(albums.filter(elem => elem.id == album.id).length).toBe(1);
      });

      t.it('getAlbum returns test album', async () => {
        const otherAlbum = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        t.expect(otherAlbum.title).toBe(album.title);
        t.expect(otherAlbum.id).toBe(album.id);
        t.expect(otherAlbum.assetCount).toBe(F_SIZE);
      });

      t.it('getAlbum with not existing album', async () => {
        const album = await MediaLibrary.getAlbumAsync(WRONG_NAME);
        t.expect(album).toBeNull();
      });

      t.it('getAssetInfo with not existing id', async () => {
        const asset = await MediaLibrary.getAssetInfoAsync(WRONG_ID);
        t.expect(asset).toBeNull();
      });

      // On both platforms assets should perserve their id. On iOS it's native behaviour,
      // but on Android it should be implemented (but it isn't)
      // t.it("After createAlbum and addAssetsTo album all assets have the same id", async () => {
      //   await Promise.all(testAssets.map(async asset => {
      //     const info = await MediaLibrary.getAssetInfoAsync(asset);
      //     t.expect(info.id).toBe(asset.id);
      //   }));
      // });
    });

    t.describe('getAssetsAsync', async () => {
      t.it('No arguments', async () => {
        const options = {};
        const { assets } = await MediaLibrary.getAssetsAsync(options);
        t.expect(assets.length).toBeLessThanOrEqual(DEFAULT_PAGE_SIZE);
        t.expect(assets.length).toBeGreaterThanOrEqual(IMG_NUMBER);
        assets.forEach(asset => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
      });

      t.it('album', async () => {
        const options = { album };
        const { assets } = await MediaLibrary.getAssetsAsync(options);
        t.expect(assets.length).toBe(IMG_NUMBER);
        assets.forEach(asset => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
        if (Platform.OS == 'android')
          assets.forEach(asset => t.expect(asset.albumId).toBe(album.id));
      });

      t.it('first, after', async () => {
        const options = { first: 2, album };
        {
          const { assets, endCursor, hasNextPage, totalCount } = await MediaLibrary.getAssetsAsync(
            options
          );
          t.expect(assets.length).toBe(2);
          t.expect(totalCount).toBe(IMG_NUMBER);
          t.expect(hasNextPage).toBeTruthy();
          assets.forEach(asset => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
          options.after = endCursor;
        }
        {
          const { assets, hasNextPage, totalCount } = await MediaLibrary.getAssetsAsync(options);
          t.expect(assets.length).toBe(IMG_NUMBER - 2);
          t.expect(totalCount).toBe(IMG_NUMBER);
          t.expect(hasNextPage).toBeFalsy();
        }
      });

      t.it('mediaType: video', async () => {
        const mediaType = MediaLibrary.MediaType.video;
        const options = { mediaType, album };
        const { assets } = await MediaLibrary.getAssetsAsync(options);
        assets.forEach(asset => t.expect(asset.mediaType).toBe(mediaType));
        t.expect(assets.length).toBe(1);
      });

      t.it('mediaType: photo', async () => {
        const mediaType = MediaLibrary.MediaType.photo;
        const options = { mediaType, album };
        const { assets } = await MediaLibrary.getAssetsAsync(options);
        t.expect(assets.length).toBe(IMG_NUMBER);
        assets.forEach(asset => t.expect(asset.mediaType).toBe(mediaType));
      });
    });

    t.describe('Delete tests', async () => {
      t.it('deleteAsstetsAsync', async () => {
        const { assets } = await MediaLibrary.getAssetsAsync({ album, mediaType: MEDIA_TYPES });
        const result = await MediaLibrary.deleteAssetsAsync(assets.slice(0, 2));
        const { assets: rest } = await MediaLibrary.getAssetsAsync({
          album,
          mediaType: MEDIA_TYPES,
        });
        t.expect(result).toEqual(true);
        t.expect(rest.length).toBe(F_SIZE - 2);
      });
      t.it('deleteAlbumsAsync', async () => {
        const result = await MediaLibrary.deleteAlbumsAsync(album, true);
        t.expect(result).toEqual(true);
        album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        t.expect(album).toBeNull();
      });
      t.it('deleteManyAlbums', async () => {
        const assets = await getAssets(files.slice(0, 2));
        let firstAlbum = await MediaLibrary.createAlbumAsync(FIRST_ALBUM, assets[0], false);
        let secondAlbum = await MediaLibrary.createAlbumAsync(SECOND_ALBUM, assets[1], false);
        await MediaLibrary.deleteAlbumsAsync([firstAlbum, secondAlbum], true);
        firstAlbum = await MediaLibrary.getAlbumAsync(FIRST_ALBUM);
        secondAlbum = await MediaLibrary.getAlbumAsync(SECOND_ALBUM);
        const firstAsset = await MediaLibrary.getAssetInfoAsync(assets[0]);
        const secondAsset = await MediaLibrary.getAssetInfoAsync(assets[1]);
        t.expect(firstAlbum).toBeNull();
        t.expect(secondAlbum).toBeNull();
        t.expect(firstAsset).toBeNull();
        t.expect(secondAsset).toBeNull();
      });
    });

    t.describe('Listeners', async () => {
      t.it('addAsset calls listener', async () => {
        const spy = t.jasmine.createSpy('addAsset spy', () => {});
        const remove = MediaLibrary.addListener(spy);
        const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
        await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);
        remove.remove();
        await MediaLibrary.deleteAssetsAsync(asset);
      });

      t.it('remove listener', async () => {
        const spy = t.jasmine.createSpy('remove spy', () => {});
        const subscription = MediaLibrary.addListener(spy);
        subscription.remove();
        const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
        await MediaLibrary.deleteAssetsAsync(asset);
        await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);
      });

      t.it('deleteListener calls listener', async () => {
        const spy = t.jasmine.createSpy('deleteAsset spy', () => {});
        const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
        const subscription = MediaLibrary.addListener(spy);
        await MediaLibrary.deleteAssetsAsync(asset);
        await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);
        subscription.remove();
      });

      t.it('removeAllListeners', async () => {
        const spy = t.jasmine.createSpy('removeAll', () => {});
        MediaLibrary.addListener(spy);
        MediaLibrary.removeAllListeners();
        const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
        await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);
        await MediaLibrary.deleteAssetsAsync(asset);
      });
    });
  });
}
