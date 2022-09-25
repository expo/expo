import { Asset } from 'expo-asset';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import * as TestUtils from '../TestUtils';
import { isDeviceFarm } from '../utils/Environment';
import { waitFor } from './helpers';

export const name = 'MediaLibrary';

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
// const MEDIA_TYPES = [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video];
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

// We don't want to move files to the albums on Android R or higher, because it requires a user confirmation.
const shouldCopyAssets = Platform.OS === 'android' && Platform.Version >= 30;

async function getFiles() {
  return await Asset.loadAsync(FILES);
}

async function getAssets(files) {
  return await Promise.all(
    files.map(({ localUri }) => {
      return MediaLibrary.createAssetAsync(localUri);
    })
  );
}

async function createAlbum(assets, name) {
  const album = await MediaLibrary.createAlbumAsync(name, assets[0], shouldCopyAssets);
  if (assets.length > 1) {
    await MediaLibrary.addAssetsToAlbumAsync(assets.slice(1), album, shouldCopyAssets);
  }
  return album;
}

async function checkIfThrows(f) {
  try {
    await f();
  } catch {
    return true;
  }

  return false;
}

function timeoutWrapper(fun, time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      fun();
      resolve(null);
    }, time);
  });
}

export async function test(t) {
  const shouldSkipTestsRequiringPermissions =
    (await TestUtils.shouldSkipTestsRequiringPermissionsAsync()) && isDeviceFarm();
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : t.describe;
  // On iOS and on android R or higher, some actions require user confirmation. For those actions, we set the timeout to 30 seconds.
  const TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT =
    (Platform.OS === 'android' && Platform.Version >= 30) || Platform.OS === 'ios'
      ? 30 * 1000
      : t.jasmine.DEFAULT_TIMEOUT_INTERVAL;

  describeWithPermissions('MediaLibrary', async () => {
    let files;
    let permissions;

    const checkIfAllPermissionsWereGranted = () => {
      if (Platform.OS === 'ios') {
        return permissions.accessPrivileges === 'all';
      }
      return permissions.granted;
    };

    const oldIt = t.it;
    t.it = (name, fn, timeout) =>
      oldIt(
        name,
        async () => {
          if (checkIfAllPermissionsWereGranted()) {
            await fn();
          }
        },
        timeout
      );

    t.beforeAll(async () => {
      files = await getFiles();
      permissions = await MediaLibrary.requestPermissionsAsync();
      if (!checkIfAllPermissionsWereGranted()) {
        console.warn('Tests were skipped - not enough permissions to run them.');
      }
    });

    t.describe('With default assets', async () => {
      let testAssets;
      let album;

      async function initializeDefaultAssetsAsync() {
        testAssets = await getAssets(files);
        album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (album == null) {
          album = await createAlbum(testAssets, ALBUM_NAME);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync(testAssets, album, shouldCopyAssets);
        }
      }

      async function cleanupAsync() {
        if (checkIfAllPermissionsWereGranted()) {
          await MediaLibrary.deleteAssetsAsync(testAssets);
          await MediaLibrary.deleteAlbumsAsync(album);
        }
      }

      t.beforeAll(async () => {
        // NOTE(2020-06-03): The `initializeAsync` function is flaky on Android; often the
        // `addAssetsToAlbumAsync` method call inside of `createAlbum` will fail with the error
        // "Could not get all of the requested assets". Usually retrying a few times works, so we do
        // that programmatically here.
        let error;
        for (let i = 0; i < 3; i++) {
          try {
            await initializeDefaultAssetsAsync();
            return;
          } catch (e) {
            error = e;
            console.log('Error initializing MediaLibrary tests, trying again', e.message);
            await cleanupAsync();
            await waitFor(1000);
          }
        }
        // if we get here, just throw
        throw error;
      }, TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT);

      t.afterAll(async () => {
        await cleanupAsync();
      }, TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT);

      t.describe('Every return value has proper shape', async () => {
        t.it('createAssetAsync', () => {
          const keys = Object.keys(testAssets[0]);
          ASSET_KEYS.forEach((key) => t.expect(keys).toContain(key));
        });

        t.it('getAssetInfoAsync', async () => {
          const { assets } = await MediaLibrary.getAssetsAsync();
          const value = await MediaLibrary.getAssetInfoAsync(assets[0]);
          const keys = Object.keys(value);
          INFO_KEYS.forEach((key) => t.expect(keys).toContain(key));
        });

        t.it('getAlbumAsync', async () => {
          const value = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
          const keys = Object.keys(value);
          ALBUM_KEYS.forEach((key) => t.expect(keys).toContain(key));
        });

        t.it('getAssetsAsync', async () => {
          const value = await MediaLibrary.getAssetsAsync();
          const keys = Object.keys(value);
          GET_ASSETS_KEYS.forEach((key) => t.expect(keys).toContain(key));
        });
      });

      t.describe('Small tests', async () => {
        t.it('Function getAlbums returns test album', async () => {
          const albums = await MediaLibrary.getAlbumsAsync();
          t.expect(albums.filter((elem) => elem.id === album.id).length).toBe(1);
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

        t.it(
          'saveToLibraryAsync should throw when the provided path does not contain an extension',
          async () => {
            t.expect(
              await checkIfThrows(() => MediaLibrary.saveToLibraryAsync('/test/file'))
            ).toBeTruthy();
          }
        );

        t.it(
          'createAssetAsync should throw when the provided path does not contain an extension',
          async () => {
            t.expect(
              await checkIfThrows(() => MediaLibrary.createAssetAsync('/test/file'))
            ).toBeTruthy();
          }
        );

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
          assets.forEach((asset) => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
        });

        t.it('album', async () => {
          const options = { album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          t.expect(assets.length).toBe(IMG_NUMBER);
          assets.forEach((asset) => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
          if (Platform.OS === 'android')
            assets.forEach((asset) => t.expect(asset.albumId).toBe(album.id));
        });

        t.it('first, after', async () => {
          const options = { first: 2, album };
          {
            const { assets, endCursor, hasNextPage, totalCount } =
              await MediaLibrary.getAssetsAsync(options);
            t.expect(assets.length).toBe(2);
            t.expect(totalCount).toBe(IMG_NUMBER);
            t.expect(hasNextPage).toBeTruthy();
            assets.forEach((asset) => t.expect(DEFAULT_MEDIA_TYPES).toContain(asset.mediaType));
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
          assets.forEach((asset) => t.expect(asset.mediaType).toBe(mediaType));
          t.expect(assets.length).toBe(1);
        });

        t.it('mediaType: photo', async () => {
          const mediaType = MediaLibrary.MediaType.photo;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          t.expect(assets.length).toBe(IMG_NUMBER);
          assets.forEach((asset) => t.expect(asset.mediaType).toBe(mediaType));
        });

        t.it('check size - photo', async () => {
          const mediaType = MediaLibrary.MediaType.photo;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          t.expect(assets.length).toBe(IMG_NUMBER);
          assets.forEach((asset) => {
            t.expect(asset.width).not.toEqual(0);
            t.expect(asset.height).not.toEqual(0);
          });
        });

        t.it('check size - video', async () => {
          const mediaType = MediaLibrary.MediaType.video;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          t.expect(assets.length).toBe(VIDEO_NUMBER);
          assets.forEach((asset) => {
            t.expect(asset.width).not.toEqual(0);
            t.expect(asset.height).not.toEqual(0);
          });
        });

        t.it('supports getting assets from specified time range', async () => {
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
          t.expect(filteredAssets.length).toBeLessThanOrEqual(assets.length);

          // Check if every asset was created within the time range.
          for (const asset of filteredAssets) {
            t.expect(asset.creationTime).toBeLessThanOrEqual(createdBefore);
            t.expect(asset.creationTime).toBeGreaterThanOrEqual(createdAfter);
          }
        });
      });

      t.describe('getAssetInfoAsync', async () => {
        t.it('shouldDownloadFromNetwork: false, for photos', async () => {
          const mediaType = MediaLibrary.MediaType.photo;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          const value = await MediaLibrary.getAssetInfoAsync(assets[0], {
            shouldDownloadFromNetwork: false,
          });
          const keys = Object.keys(value);

          const expectedExtraKeys = Platform.select({
            ios: ['isNetworkAsset'],
            default: [],
          });
          expectedExtraKeys.forEach((key) => t.expect(keys).toContain(key));
          if (Platform.OS === 'ios') {
            t.expect(value['isNetworkAsset']).toBe(false);
          }
        });

        t.it('shouldDownloadFromNetwork: true, for photos', async () => {
          const mediaType = MediaLibrary.MediaType.photo;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          const value = await MediaLibrary.getAssetInfoAsync(assets[0], {
            shouldDownloadFromNetwork: true,
          });
          const keys = Object.keys(value);

          const expectedExtraKeys = Platform.select({
            ios: ['isNetworkAsset'],
            default: [],
          });
          expectedExtraKeys.forEach((key) => t.expect(keys).not.toContain(key));
        });

        t.it('shouldDownloadFromNetwork: false, for videos', async () => {
          const mediaType = MediaLibrary.MediaType.video;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          const value = await MediaLibrary.getAssetInfoAsync(assets[0], {
            shouldDownloadFromNetwork: false,
          });
          const keys = Object.keys(value);

          const expectedExtraKeys = Platform.select({
            ios: ['isNetworkAsset'],
            default: [],
          });
          expectedExtraKeys.forEach((key) => t.expect(keys).toContain(key));
          if (Platform.OS === 'ios') {
            t.expect(value['isNetworkAsset']).toBe(false);
          }
        });

        t.it('shouldDownloadFromNetwork: true, for videos', async () => {
          const mediaType = MediaLibrary.MediaType.video;
          const options = { mediaType, album };
          const { assets } = await MediaLibrary.getAssetsAsync(options);
          const value = await MediaLibrary.getAssetInfoAsync(assets[0], {
            shouldDownloadFromNetwork: true,
          });
          const keys = Object.keys(value);

          const expectedExtraKeys = Platform.select({
            ios: ['isNetworkAsset'],
            default: [],
          });
          expectedExtraKeys.forEach((key) => t.expect(keys).not.toContain(key));
        });
      });
    });

    t.describe('Delete tests', async () => {
      t.it(
        'deleteAssetsAsync',
        async () => {
          const assets = await getAssets(files);
          const result = await MediaLibrary.deleteAssetsAsync(assets);
          const deletedAssets = await Promise.all(
            assets.map(async (asset) => await MediaLibrary.getAssetInfoAsync(asset))
          );
          t.expect(result).toEqual(true);
          t.expect(assets.length).not.toEqual(0);
          t.expect(deletedAssets.length).toEqual(assets.length);
          deletedAssets.forEach((deletedAsset) => t.expect(deletedAsset).toBeNull);
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );

      t.it(
        'deleteAlbumsAsync',
        async () => {
          const assets = await getAssets([files[0]]);
          const album = await createAlbum(assets, ALBUM_NAME);

          const result = await MediaLibrary.deleteAlbumsAsync(album, true);
          t.expect(result).toEqual(true);
          const deletedAlbum = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
          t.expect(deletedAlbum).toBeNull();

          if (shouldCopyAssets) {
            await MediaLibrary.deleteAssetsAsync(assets);
          }
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );

      t.it(
        'deleteManyAlbums',
        async () => {
          const assets = await getAssets(files.slice(0, 2));
          let firstAlbum = await MediaLibrary.createAlbumAsync(
            ALBUM_NAME,
            assets[0],
            shouldCopyAssets
          );

          let secondAlbum = await MediaLibrary.createAlbumAsync(
            SECOND_ALBUM_NAME,
            assets[1],
            shouldCopyAssets
          );

          await MediaLibrary.deleteAlbumsAsync([firstAlbum, secondAlbum], true);
          firstAlbum = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
          secondAlbum = await MediaLibrary.getAlbumAsync(SECOND_ALBUM_NAME);
          t.expect(firstAlbum).toBeNull();
          t.expect(secondAlbum).toBeNull();

          if (!shouldCopyAssets) {
            const firstAsset = await MediaLibrary.getAssetInfoAsync(assets[0]);
            const secondAsset = await MediaLibrary.getAssetInfoAsync(assets[1]);
            t.expect(firstAsset).toBeNull();
            t.expect(secondAsset).toBeNull();
          } else {
            await MediaLibrary.deleteAssetsAsync(assets);
          }
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );
    });

    t.describe('Listeners', async () => {
      const createdAssets = [];

      t.afterAll(async () => {
        if (createdAssets) {
          await MediaLibrary.deleteAssetsAsync(createdAssets);
        }
      }, TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT);

      t.it(
        'addAsset calls listener',
        async () => {
          const spy = t.jasmine.createSpy('addAsset spy', () => {});
          const remove = MediaLibrary.addListener(spy);
          const asset = await MediaLibrary.createAssetAsync(files[0].localUri);

          t.expect(asset).not.toBeNull();
          await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);

          remove.remove();
          createdAssets.push(asset);
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );

      t.it(
        'remove listener',
        async () => {
          const spy = t.jasmine.createSpy('remove spy', () => {});
          const subscription = MediaLibrary.addListener(spy);
          subscription.remove();
          const asset = await MediaLibrary.createAssetAsync(files[0].localUri);

          t.expect(asset).not.toBeNull();
          await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);

          createdAssets.push(asset);
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );

      t.it(
        'deleteListener calls listener',
        async () => {
          const spy = t.jasmine.createSpy('deleteAsset spy', () => {});
          const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
          const subscription = MediaLibrary.addListener(spy);

          t.expect(asset).not.toBeNull();
          await MediaLibrary.deleteAssetsAsync(asset);
          await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);
          subscription.remove();
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );

      t.it(
        'removeAllListeners',
        async () => {
          const spy = t.jasmine.createSpy('removeAll', () => {});
          MediaLibrary.addListener(spy);
          MediaLibrary.removeAllListeners();

          const asset = await MediaLibrary.createAssetAsync(files[0].localUri);
          t.expect(asset).not.toBeNull();
          await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);

          createdAssets.push(asset);
        },
        TIMEOUT_WHEN_USER_NEEDS_TO_INTERACT
      );
    });
  });
}
