import { Asset as ExpoAsset } from 'expo-asset';
import {
  Asset,
  Album,
  requestPermissionsAsync,
  Query,
  MediaType,
  AssetField,
  addListener,
  removeAllListeners,
} from 'expo-media-library';
import { Platform } from 'react-native';

export const name = 'MediaLibrary@Next';

const mp3Path = require('../assets/LLizard.mp3');
const mp4Path = require('../assets/big_buck_bunny.mp4');
const exifJpgPath = require('../assets/exif_data_image.jpg');
const pngPath = require('../assets/icons/app.png');
const jpgPath = require('../assets/qrcode_expo.jpg');

export async function test(t: any) {
  let localUris: string[];
  let mp3FileLocalUri: string;
  let pngFileLocalUri: string;
  let jpgFileLocalUri: string;
  let mp4FileLocalUri: string;
  let exifJpgFileLocalUri: string;

  t.beforeAll(async () => {
    const permissionResponse = await requestPermissionsAsync();
    if (!permissionResponse.granted) {
      throw new Error('Permission to access media library is required for testing');
    }

    const loadAssetLocalUri = async (assetModule: any, assetName: string): Promise<string> => {
      const [asset] = await ExpoAsset.loadAsync(assetModule);
      if (asset.localUri === null) {
        throw new Error(`Failed to load ${assetName} file for testing`);
      }
      return asset.localUri;
    };
    mp3FileLocalUri = await loadAssetLocalUri(mp3Path, 'MP3');
    pngFileLocalUri = await loadAssetLocalUri(pngPath, 'PNG');
    jpgFileLocalUri = await loadAssetLocalUri(jpgPath, 'JPG');
    mp4FileLocalUri = await loadAssetLocalUri(mp4Path, 'MP4');
    exifJpgFileLocalUri = await loadAssetLocalUri(exifJpgPath, 'EXIF JPG');
    localUris = [pngFileLocalUri, jpgFileLocalUri, mp4FileLocalUri];
  });

  let albumsContainer: (Album | Album[])[] = [];
  let assetsContainer: (Asset | Asset[])[] = [];

  t.afterAll(async () => {
    try {
      await Asset.delete(assetsContainer.flat());
      await Album.delete(albumsContainer.flat(), true);
      albumsContainer = [];
      assetsContainer = [];
    } catch (error) {
      console.error('Error cleaning up test assets:', error);
    }
  });

  t.describe('Stress tests', () => {
    t.it('creating files with the same filename', async () => {
      const assetCount = 40;
      for (let i = 0; i < assetCount; i++) {
        const asset = await Asset.create(pngFileLocalUri);
        assetsContainer.push(asset);
      }
    });

    t.it('moving files with the same filename to album', async () => {
      const createdAssets: Asset[] = [];
      for (let i = 0; i < 40; i++) {
        const album = await Album.create(createAlbumName(`temp album ${i}`), [pngFileLocalUri]);
        albumsContainer.push(album);
        createdAssets.push(...(await album.getAssets()));
      }
      assetsContainer.push(...createdAssets);
      const albumName = createAlbumName('stress test moving directories');
      const album = await Album.create(albumName, createdAssets);
      albumsContainer.push(album);
    });
  });
  t.describe('Album creation', () => {
    t.it('creates an album from a list of paths', async () => {
      const albumName = createAlbumName('album from paths');
      const album = await Album.create(albumName, localUris);
      albumsContainer.push(album);

      const assets = await album.getAssets();
      t.expect(assets.length).toBe(localUris.length);
      t.expect(await album.getTitle()).toBe(albumName);
    });
    t.it('creates an album from a list of assets', async () => {
      // given
      const assets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
      assetsContainer.push(...assets);
      const albumName = createAlbumName('album from assets');

      // when
      const album = await Album.create(albumName, assets);
      albumsContainer.push(album);

      // then
      t.expect(assets.length).toBe(localUris.length);
      t.expect(await album.getTitle()).toBe(albumName);
      const fetchedAssets = await album.getAssets();
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        for (const asset of assets) {
          t.expect(
            fetchedAssets.findIndex((fetchedAsset) => fetchedAsset.id === asset.id)
          ).not.toBe(-1);
        }
      }
    });

    if (Platform.OS === 'android') {
      t.it('when creating an album from a list of assets should correctly move files', async () => {
        // given
        const assets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
        assetsContainer.push(...assets);
        const oldAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        const albumName = createAlbumName('album from assets move');

        // when
        const album = await Album.create(albumName, assets);

        // then
        const newAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        albumsContainer.push(album);
        for (const oldAssetUri of oldAssetUris) {
          t.expect(newAssetUris.findIndex((uri) => uri === oldAssetUri)).toBe(-1);
        }
      });
      t.it('when creating an album from a list of assets should correctly copy files', async () => {
        // given
        const assets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
        assetsContainer.push(...assets);
        const oldAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        const albumName = createAlbumName('album from assets copy');

        // when
        const album = await Album.create(albumName, assets, false);

        // then
        const newAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        albumsContainer.push(album);
        if (Platform.OS === 'android' && Platform.Version >= 30) {
          for (const oldAssetUri of oldAssetUris) {
            t.expect(newAssetUris.findIndex((uri) => uri === oldAssetUri)).not.toBe(-1);
          }
        } else {
          t.expect();
        }
      });
    }
  });

  t.describe('Asset creation', () => {
    t.it('creates a PNG asset', async () => {
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    if (Platform.OS === 'ios') {
      t.it('fails when creating an MP3 asset', async () => {
        try {
          const asset = await Asset.create(mp3FileLocalUri);
          assetsContainer.push(asset);
          t.fail();
        } catch (e) {
          t.expect(e).toBeDefined();
        }
      });
    } else {
      t.it('creates an MP3 asset', async () => {
        const asset = await Asset.create(mp3FileLocalUri);
        assetsContainer.push(asset);
        t.expect(asset.id).toBeDefined();
      });
    }

    t.it('creates an MP4 asset', async () => {
      const asset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    t.it('creates a JPG asset', async () => {
      const asset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    t.it('creates an asset inside an album', async () => {
      const albumName = createAlbumName('asset inside album');
      const firstAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(firstAsset);
      const album = await Album.create(albumName, [firstAsset]);
      albumsContainer.push(album);

      const newAsset = await Asset.create(jpgFileLocalUri, album);
      assetsContainer.push(newAsset);

      t.expect(newAsset.id).toBeDefined();
      const assets = await album.getAssets();
      const assetIds = assets.map((a) => a.id);
      t.expect(assetIds).toContain(newAsset.id);
    });

    if (Platform.OS === 'android') {
      t.it('creates two different assets with different uri from the same source', async () => {
        const firstAsset = await Asset.create(jpgFileLocalUri);
        const secondAsset = await Asset.create(jpgFileLocalUri);
        assetsContainer.push([firstAsset, secondAsset]);
        const firstUri = await firstAsset.getUri();
        const secondUri = await secondAsset.getUri();

        t.expect(firstUri).not.toBe(secondUri);
        t.expect(firstAsset.id).not.toBe(secondAsset.id);
      });
    }
  });

  t.describe('Album get', () => {
    t.it('gets an album by title', async () => {
      const albumName = createAlbumName('gets an album by title');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);

      const fetchedAlbum = await Album.get(albumName);
      if (fetchedAlbum === null) {
        return t.fail('Album should be found by title');
      }
      t.expect(fetchedAlbum).toBeDefined();
      t.expect(fetchedAlbum.id).toBe(album.id);
    });
  });

  t.describe('Album getAll', () => {
    t.it('includes a newly created album', async () => {
      // given
      const albumName = createAlbumName('getAll includes new album');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);

      // when
      const albums = await Album.getAll();

      // then
      t.expect(albums.find((a) => a.id === album.id)).toBeDefined();
    });

    t.it('does not include a deleted album', async () => {
      // given
      const albumName = createAlbumName('getAll excludes deleted album');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      assetsContainer.push(await album.getAssets());
      await album.delete();

      // when
      const albums = await Album.getAll();

      // then
      t.expect(albums.find((a) => a.id === album.id)).toBeUndefined();
    });
  });

  t.describe('Album deletion', () => {
    t.it('deletes an album', async () => {
      const albumName = createAlbumName('album deletion');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);
      assetsContainer.push(await album.getAssets());

      await album.delete();

      const deletedAlbum = new Album(album.id);
      try {
        await deletedAlbum.getTitle();
        t.fail();
      } catch (e) {
        t.expect(e).toBeDefined();
      }
    });
  });

  t.describe('Add asset to album', () => {
    t.it('adds an asset to an existing album', async () => {
      const albumName = createAlbumName('add asset');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);

      const newAsset = await Asset.create(pngFileLocalUri);
      const oldUri = await newAsset.getUri();
      assetsContainer.push(newAsset);
      await album.add(newAsset);

      const assets = await album.getAssets();
      t.expect(await album.getTitle()).toBe(albumName);
      t.expect(assets.length).toBe(2);
      if (Platform.OS === 'android') {
        t.expect(oldUri).not.toBe(await newAsset.getUri());
      }
      t.expect(assets.find((asset) => asset.id === newAsset.id)).not.toBe(null);
    });

    t.it('adds an array of assets to an existing album', async () => {
      // given
      const albumName = createAlbumName('add asset array');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);

      const newAssets = await Promise.all([
        Asset.create(pngFileLocalUri),
        Asset.create(mp4FileLocalUri),
      ]);
      const oldUris = await Promise.all(newAssets.map((asset) => asset.getUri()));
      assetsContainer.push(...newAssets);

      // when
      await album.add(newAssets);

      // then
      const albumAssets = await album.getAssets();
      t.expect(albumAssets.length).toBe(3);
      for (const newAsset of newAssets) {
        t.expect(albumAssets.find((asset) => asset.id === newAsset.id)).not.toBe(null);
      }
      if (Platform.OS === 'android') {
        const newUris = await Promise.all(newAssets.map((asset) => asset.getUri()));
        for (const oldUri of oldUris) {
          t.expect(newUris.findIndex((uri) => uri === oldUri)).toBe(-1);
        }
      }
    });

    t.it('does nothing when adding an empty array to an album', async () => {
      // given
      const albumName = createAlbumName('add empty array');
      const album = await Album.create(albumName, [jpgFileLocalUri], true);
      albumsContainer.push(album);
      assetsContainer.push(...(await album.getAssets()));

      // when
      await album.add([]);

      // then
      const assets = await album.getAssets();
      t.expect(assets.length).toBe(1);
    });
  });

  if (Platform.OS === 'ios') {
    t.describe('Remove assets from album', () => {
      t.it('removes an asset from an album without deleting it from the library', async () => {
        const albumName = createAlbumName('remove asset');
        const album = await Album.create(albumName, [jpgFileLocalUri], true);
        albumsContainer.push(album);

        const assetToRemove = (await album.getAssets())[0];
        await album.removeAssets([assetToRemove]);

        const assetsAfter = await album.getAssets();
        t.expect(assetsAfter.length).toBe(0);

        const query = new Query();
        const allAssets = await query.exe();
        t.expect(allAssets.find((a) => a.id === assetToRemove.id)).not.toBeUndefined();
        assetsContainer.push(assetToRemove);
      });

      t.it('removes only specified assets, leaving others in the album', async () => {
        const albumName = createAlbumName('remove partial');
        const album = await Album.create(albumName, [jpgFileLocalUri], true);
        albumsContainer.push(album);

        const newAsset = await Asset.create(pngFileLocalUri);
        assetsContainer.push(newAsset);
        await album.add(newAsset);

        const assetsBefore = await album.getAssets();
        t.expect(assetsBefore.length).toBe(2);

        await album.removeAssets([newAsset]);

        const assetsAfter = await album.getAssets();
        t.expect(assetsAfter.length).toBe(1);
        t.expect(assetsAfter.find((a) => a.id === newAsset.id)).toBeUndefined();
      });

      t.it('does nothing when called with an empty array', async () => {
        const albumName = createAlbumName('does nothing when called with an empty array');
        const album = await Album.create(albumName, [jpgFileLocalUri], true);
        albumsContainer.push(album);

        const assetsBefore = await album.getAssets();
        t.expect(assetsBefore.length).toBe(1);

        await album.removeAssets([]);

        const assetsAfter = await album.getAssets();
        t.expect(assetsAfter.length).toBe(1);
      });

      t.it('does nothing when asset does not belong to the album', async () => {
        const albumName = createAlbumName('does nothing when asset does not belong to the album');
        const album = await Album.create(albumName, [jpgFileLocalUri], true);
        albumsContainer.push(album);

        const outsideAsset = await Asset.create(pngFileLocalUri);
        assetsContainer.push(outsideAsset);

        const assetsBefore = await album.getAssets();
        t.expect(assetsBefore.length).toBe(1);

        await album.removeAssets([outsideAsset]);

        const assetsAfter = await album.getAssets();
        t.expect(assetsAfter.length).toBe(1);

        // Verify the asset still exists in the library
        const height = await outsideAsset.getHeight();
        t.expect(height).toBeDefined();
      });
    });
  }

  t.describe('Image asset properties', () => {
    let asset: Asset;

    t.beforeEach(async () => {
      asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
    });

    t.it('returns a creation time', async () => {
      const creationTime = await asset.getCreationTime();
      t.expect(creationTime).toBeDefined();
    });

    t.it('returns a duration of null for images', async () => {
      const duration = await asset.getDuration();
      t.expect(duration).toBe(null);
    });

    t.it('returns a filename ending with .png', async () => {
      const filename = await asset.getFilename();
      t.expect(filename.toLowerCase()).toMatch(/\.png/);
    });

    t.it('returns positive height', async () => {
      const height = await asset.getHeight();
      t.expect(height).toBeGreaterThan(0);
    });

    t.it('returns a shape', async () => {
      const shape = await asset.getShape();
      t.expect(shape).toBeDefined();
      t.expect(shape?.width).toBeGreaterThan(0);
      t.expect(shape?.height).toBeGreaterThan(0);
    });

    t.it('returns a media type', async () => {
      const mediaType = await asset.getMediaType();
      t.expect(mediaType).toBeDefined();
    });

    t.it('returns correct modification time', async () => {
      const modificationTime = await asset.getModificationTime();
      if (modificationTime === null) {
        return t.fail('Modification time should not be null for an asset');
      }
      t.expect(new Date(modificationTime).getFullYear()).toBeGreaterThan(1970);
      t.expect(modificationTime).toBeGreaterThan(0);
    });

    t.it('returns a uri ending with .png', async () => {
      const uri = await asset.getUri();
      t.expect(uri.toLowerCase()).toMatch(/\.png/);
    });

    t.it('returns positive width', async () => {
      const width = await asset.getWidth();
      t.expect(width).toBeGreaterThan(0);
    });

    t.it('sets and gets favorite status', async () => {
      if (Platform.OS === 'android' && Platform.Version < 29) {
        t.expect(await asset.getFavorite()).toBe(false);
        await asset.setFavorite(true);
        t.expect(await asset.getFavorite()).toBe(false);
      } else {
        t.expect(await asset.getFavorite()).toBe(false);
        await asset.setFavorite(true);
        t.expect(await asset.getFavorite()).toBe(true);
        await asset.setFavorite(false);
        t.expect(await asset.getFavorite()).toBe(false);
      }
    });

    t.it('returns an asset info object', async () => {
      const info = await asset.getInfo();
      t.expect(info).toBeDefined();
      t.expect(info.id).toBe(asset.id);
      t.expect(info.mediaType).toBe(await asset.getMediaType());
      t.expect(info.width).toBe(await asset.getWidth());
      t.expect(info.height).toBe(await asset.getHeight());
      t.expect(info.uri).toBe(await asset.getUri());
      t.expect(info.filename).toBe(await asset.getFilename());
      t.expect(info.duration).toBe(await asset.getDuration());
      t.expect(info.creationTime).toBe(await asset.getCreationTime());
      t.expect(info.modificationTime).toBe(await asset.getModificationTime());
      t.expect(info.isFavorite).toBe(await asset.getFavorite());
    });
  });

  t.describe('Video asset properties', () => {
    let videoAsset: Asset;

    t.beforeEach(async () => {
      videoAsset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(videoAsset);
    });

    t.it('returns a creation time', async () => {
      const creationDate = await videoAsset.getCreationTime();
      t.expect(creationDate).toBeDefined();
    });

    t.it('returns positive duration', async () => {
      const duration = await videoAsset.getDuration();
      t.expect(duration).toBeGreaterThan(0);
    });

    t.it('returns a display name ending with .mp4', async () => {
      const filename = await videoAsset.getFilename();
      t.expect(filename.toLowerCase()).toMatch(/\.mp4/);
    });

    t.it('returns positive height', async () => {
      const height = await videoAsset.getHeight();
      t.expect(height).toBeGreaterThan(0);
    });

    t.it('returns a media type', async () => {
      const mediaType = await videoAsset.getMediaType();
      t.expect(mediaType).toBeDefined();
    });

    t.it('returns correct modification time', async () => {
      const modificationTime = await videoAsset.getModificationTime();
      if (modificationTime === null) {
        return t.fail('Modification time should not be null for a video asset');
      }
      t.expect(new Date(modificationTime).getFullYear()).toBeGreaterThan(1970);
      t.expect(modificationTime).toBeGreaterThan(0);
    });

    t.it('returns a uri ending with .mp4', async () => {
      const uri = await videoAsset.getUri();
      t.expect(uri.toLowerCase()).toMatch(/\.mp4/);
    });

    t.it('returns positive width', async () => {
      const width = await videoAsset.getWidth();
      t.expect(width).toBeGreaterThan(0);
    });
  });

  t.describe('Asset query', () => {
    t.it('limit works correctly', async () => {
      // given
      const createdAssets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
      assetsContainer.push(...createdAssets);
      // when
      const assets = await new Query().limit(3).exe();
      // then
      t.expect(assets.length).toBe(3);
      t.expect(assets[0].id).not.toBe(null);
    });

    t.it('offset works correctly', async () => {
      // given
      const createdAssets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
      assetsContainer.push(...createdAssets);
      // when
      const query = new Query();
      const [firstAsset] = await query.limit(1).exe();
      const [secondAsset] = await query.offset(1).exe();
      const [bothFirstAsset, bothSecondAsset] = await new Query().limit(2).exe();
      // then
      t.expect(firstAsset.id).toBe(bothFirstAsset.id);
      t.expect(secondAsset.id).toBe(bothSecondAsset.id);
    });

    t.it('limit 0 returns no assets', async () => {
      // given
      const createdAssets = await Promise.all(localUris.map((uri) => Asset.create(uri)));
      assetsContainer.push(...createdAssets);
      const albumName = createAlbumName('limit 0 returns no assets');
      const album = await Album.create(albumName, createdAssets);
      albumsContainer.push(album);
      // when
      const assets = await new Query().album(album).limit(0).exe();
      // then
      t.expect(assets.length).toBe(0);
    });

    t.it('offset outside of bounds works correctly', async () => {
      // given
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      const albumName = createAlbumName('offset outside of bounds works correctly');
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [firstAsset] = await new Query().offset(10).album(album).exe();
      // then
      t.expect(firstAsset).toBeUndefined();
    });

    t.it('mediatype image works correctly', async () => {
      // given
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      // when
      const [imageAsset] = await new Query()
        .limit(1)
        .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
        .exe();
      // then
      t.expect(await imageAsset.getMediaType()).toBe(MediaType.IMAGE);
      t.expect(await asset.getMediaType()).toBe(MediaType.IMAGE);
    });

    t.it('mediatype video works correctly', async () => {
      // given
      const asset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(asset);
      // when
      const [videoAsset] = await new Query()
        .limit(1)
        .within(AssetField.MEDIA_TYPE, [MediaType.VIDEO])
        .exe();
      // then
      t.expect(await videoAsset.getMediaType()).toBe(MediaType.VIDEO);
    });

    t.it('isFavorite filter works correctly', async () => {
      // given
      const albumName = createAlbumName('isFavorite filter');
      const favoriteAsset = await Asset.create(pngFileLocalUri);
      const nonFavoriteAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(favoriteAsset, nonFavoriteAsset);
      const album = await Album.create(albumName, [favoriteAsset, nonFavoriteAsset]);
      albumsContainer.push(album);
      await favoriteAsset.setFavorite(true);

      // when
      const favoriteAssets = await new Query().album(album).eq(AssetField.IS_FAVORITE, true).exe();
      const nonFavoriteAssets = await new Query()
        .album(album)
        .eq(AssetField.IS_FAVORITE, false)
        .exe();

      // then
      if (Platform.OS === 'android' && Platform.Version < 29) {
        // IS_FAVORITE filtering is a no-op pre-Q — both queries return all assets
        t.expect(favoriteAssets.length).toBe(2);
        t.expect(nonFavoriteAssets.length).toBe(2);
      } else {
        t.expect(favoriteAssets.map((a) => a.id)).toContain(favoriteAsset.id);
        t.expect(favoriteAssets.map((a) => a.id)).not.toContain(nonFavoriteAsset.id);
        t.expect(nonFavoriteAssets.map((a) => a.id)).toContain(nonFavoriteAsset.id);
        t.expect(nonFavoriteAssets.map((a) => a.id)).not.toContain(favoriteAsset.id);
      }
    });

    if (Platform.OS !== 'ios') {
      t.it('mediatype audio works correctly', async () => {
        // given
        const asset = await Asset.create(mp3FileLocalUri);
        assetsContainer.push(asset);
        // when
        const query = new Query().limit(1).within(AssetField.MEDIA_TYPE, [MediaType.AUDIO]);
        const [audioAsset] = await query.exe();
        // then
        t.expect(await audioAsset.getMediaType()).toBe(MediaType.AUDIO);
      });
    }

    t.it('album works correctly', async () => {
      // given
      const albumName = createAlbumName('album works correctly');
      const asset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [queriedAsset] = await new Query().limit(1).album(album).exe();
      // then
      t.expect(await queriedAsset.getMediaType()).toBe(MediaType.VIDEO);
      const assetsInAlbum = await album.getAssets();
      t.expect(assetsInAlbum.map((a) => a.id)).toContain(queriedAsset.id);
    });

    t.it('modification time and gte/lte work correctly', async () => {
      // given
      const albumName = createAlbumName('modification time and gt/lt work correctly');
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const modificationTime = await asset.getModificationTime();
      if (modificationTime === null) {
        return t.fail('Modification time should not be null for an asset');
      }
      const [queriedAsset] = await new Query()
        .limit(1)
        .album(album)
        .gte(AssetField.MODIFICATION_TIME, modificationTime - 1000)
        .lte(AssetField.MODIFICATION_TIME, modificationTime + 1000)
        .exe();
      // then
      t.expect(queriedAsset.id).toBe(asset.id);
    });

    t.it('height and gte work correctly', async () => {
      // given
      const albumName = createAlbumName('height and gte work correctly');
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [queriedAsset] = await new Query()
        .limit(1)
        .album(album)
        .lt(AssetField.HEIGHT, (await asset.getHeight()) + 1)
        .exe();
      // then
      t.expect(queriedAsset.id).toBe(asset.id);
    });

    t.it('modification time and incorrect gte/lte returns empty array', async () => {
      // given
      const albumName = createAlbumName(
        'modification time and incorrect gte/lte returns empty array'
      );
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const modificationTime = await asset.getModificationTime();
      if (modificationTime === null) {
        return t.fail('Modification time should not be null for an asset');
      }
      const [queriedAsset] = await new Query()
        .limit(1)
        .album(album)
        .gte(AssetField.MODIFICATION_TIME, modificationTime + 1000)
        .lte(AssetField.MODIFICATION_TIME, modificationTime - 1000)
        .exe();
      // then
      t.expect(queriedAsset).toBeUndefined();
    });

    t.it('creation time works correctly', async () => {
      // given
      const albumName = createAlbumName('album works correctly');
      const asset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [queriedAsset] = await new Query().limit(1).album(album).exe();
      // then
      t.expect(await queriedAsset.getMediaType()).toBe(MediaType.VIDEO);
      const assetsInAlbum = await album.getAssets();
      t.expect(assetsInAlbum.map((a) => a.id)).toContain(queriedAsset.id);
    });

    t.it('orderBy height works correctly', async () => {
      // given
      const shorterAsset = await Asset.create(pngFileLocalUri);
      const tallerAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(tallerAsset);
      assetsContainer.push(shorterAsset);
      const albumName = createAlbumName('orderBy height works correctly');
      const album = await Album.create(albumName, [tallerAsset, shorterAsset]);
      albumsContainer.push(album);
      // when
      const [asset] = await new Query()
        .limit(1)
        .album(album)
        .orderBy({ key: AssetField.HEIGHT })
        .exe();
      // then
      t.expect(asset.id).toBe(shorterAsset.id);
    });

    t.it('orderBy mediaType works correctly', async () => {
      // given
      const videoAsset = await Asset.create(mp4FileLocalUri);
      const photoAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(videoAsset);
      assetsContainer.push(photoAsset);
      const albumName = createAlbumName('orderBy mediaType works correctly');
      const album = await Album.create(albumName, [videoAsset, photoAsset]);
      albumsContainer.push(album);
      // when
      const query = new Query().limit(2).album(album).orderBy({ key: AssetField.MEDIA_TYPE });
      const [firstAsset, secondAsset] = await query.exe();
      // then
      t.expect(firstAsset.id).toBe(photoAsset.id);
      t.expect(secondAsset.id).toBe(videoAsset.id);
    });

    t.it('orderBy combined works correctly', async () => {
      // given
      const videoAsset = await Asset.create(mp4FileLocalUri);
      const shorterAsset = await Asset.create(pngFileLocalUri);
      const tallerAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(videoAsset);
      assetsContainer.push(shorterAsset);
      assetsContainer.push(tallerAsset);
      const albumName = createAlbumName('orderBy combined works correctly');
      const album = await Album.create(albumName, [shorterAsset, videoAsset, tallerAsset]);
      albumsContainer.push(album);
      // when
      const query = new Query()
        .limit(3)
        .album(album)
        .orderBy({ key: AssetField.MEDIA_TYPE })
        .orderBy({ key: AssetField.HEIGHT });
      const [firstAsset, secondAsset, thirdAsset] = await query.exe();
      // then
      t.expect(firstAsset.id).toBe(shorterAsset.id);
      t.expect(secondAsset.id).toBe(tallerAsset.id);
      t.expect(thirdAsset.id).toBe(videoAsset.id);
    });

    t.it('orderBy ascending works correctly', async () => {
      // given
      const videoAsset = await Asset.create(mp4FileLocalUri);
      const shorterAsset = await Asset.create(pngFileLocalUri);
      const tallerAsset = await Asset.create(jpgFileLocalUri);
      assetsContainer.push(videoAsset);
      assetsContainer.push(shorterAsset);
      assetsContainer.push(tallerAsset);
      const albumName = createAlbumName('orderBy ascending works correctly');
      const album = await Album.create(albumName, [shorterAsset, videoAsset, tallerAsset]);
      albumsContainer.push(album);
      // when
      const query = new Query()
        .limit(3)
        .album(album)
        .orderBy({ key: AssetField.MEDIA_TYPE, ascending: false })
        .orderBy({ key: AssetField.HEIGHT });
      const [firstAsset, secondAsset, thirdAsset] = await query.exe();
      // then
      t.expect(firstAsset.id).toBe(videoAsset.id);
      t.expect(secondAsset.id).toBe(shorterAsset.id);
      t.expect(thirdAsset.id).toBe(tallerAsset.id);
    });

    t.it('exeForMetadata works correctly for images', async () => {
      // given
      const asset = await Asset.create(pngFileLocalUri);
      assetsContainer.push(asset);
      const albumName = createAlbumName('exeForMetadata works correctly for images');
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const results = await new Query().album(album).exeForMetadata();
      // then
      t.expect(results.length).toBe(1);
      const result = results[0];
      if (result.modificationTime === null) {
        return t.fail('Modification time should not be null for an asset');
      }
      t.expect(result.id).toBeDefined();
      t.expect(result.creationTime).toBeDefined();
      t.expect(result.duration).toBe(null);
      t.expect(result.filename?.toLowerCase()).toMatch(/\.png/);
      t.expect(result.height).toBeGreaterThan(0);
      t.expect(result.mediaType).toBeDefined();
      t.expect(new Date(result.modificationTime).getFullYear()).toBeGreaterThan(1970);
      t.expect(result.modificationTime).toBeGreaterThan(0);
      t.expect(result.width).toBeGreaterThan(0);
      t.expect(result.isFavorite).toBe(false);
    });

    t.it('exeForMetadata works correctly for videos', async () => {
      // given
      const asset = await Asset.create(mp4FileLocalUri);
      assetsContainer.push(asset);
      const albumName = createAlbumName('exeForMetadata works correctly for videos');
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const results = await new Query().album(album).exeForMetadata();
      // then
      t.expect(results.length).toBe(1);
      const result = results[0];
      if (result.modificationTime === null) {
        return t.fail('Modification time should not be null for a video asset');
      }
      t.expect(result.id).toBeDefined();
      t.expect(result.creationTime).toBeDefined();
      t.expect(result.duration).toBeGreaterThan(0);
      t.expect(result.filename?.toLowerCase()).toMatch(/\.mp4/);
      t.expect(result.height).toBeGreaterThan(0);
      t.expect(result.mediaType).toBeDefined();
      t.expect(new Date(result.modificationTime).getFullYear()).toBeGreaterThan(1970);
      t.expect(result.modificationTime).toBeGreaterThan(0);
      t.expect(result.width).toBeGreaterThan(0);
      t.expect(result.isFavorite).toBe(false);
    });
  });

  t.describe('asset.getAlbums()', () => {
    if (Platform.OS === 'ios') {
      t.it('returns all albums the asset belongs to', async () => {
        // given
        const asset = await Asset.create(pngFileLocalUri);
        assetsContainer.push(asset);
        const album1 = await Album.create(createAlbumName('getAlbums_ios_1'), [asset], false);
        const album2 = await Album.create(createAlbumName('getAlbums_ios_2'), [asset], false);
        albumsContainer.push(album1);
        albumsContainer.push(album2);
        // when
        const albums = await asset.getAlbums();
        // then
        t.expect(albums.find((a) => a.id === album1.id)).toBeDefined();
        t.expect(albums.find((a) => a.id === album2.id)).toBeDefined();
      });
    }

    if (Platform.OS === 'android') {
      t.it('returns only the album the asset currently resides in', async () => {
        // given
        const asset = await Asset.create(jpgFileLocalUri);
        assetsContainer.push(asset);
        const album1 = await Album.create(
          createAlbumName('returns only the album the asset currently resides in 1'),
          [asset],
          true
        );
        albumsContainer.push(album1);
        const otherAsset = await Asset.create(pngFileLocalUri);
        assetsContainer.push(otherAsset);
        const album2 = await Album.create(
          createAlbumName('returns only the album the asset currently resides in 2'),
          [otherAsset],
          true
        );
        albumsContainer.push(album2);
        await album2.add(asset);
        // when
        const albums = await asset.getAlbums();
        // then
        t.expect(albums.length).toBe(1);
        t.expect(albums[0].id).toBe(album2.id);
      });
    }
  });

  t.describe('Exif interface', () => {
    t.it('returns location for jpg image', async () => {
      // given
      const asset = await Asset.create(exifJpgFileLocalUri);
      assetsContainer.push(asset);
      // when
      const location = await asset.getLocation();
      // then
      t.expect(location).toBeDefined();
      t.expect(location?.latitude).toBeGreaterThanOrEqual(-90);
      t.expect(location?.latitude).toBeLessThanOrEqual(90);
      t.expect(location?.longitude).toBeGreaterThanOrEqual(-180);
      t.expect(location?.longitude).toBeLessThanOrEqual(180);
    });

    t.it('returns exif data for jpg image', async () => {
      // given
      const asset = await Asset.create(exifJpgFileLocalUri);
      assetsContainer.push(asset);
      // when
      const exif = await asset.getExif();
      // then
      const numberOfKeys = Object.keys(exif || {}).length;
      if (Platform.OS === 'android') {
        t.expect(exif['Make']).not.toBeUndefined();
        t.expect(exif['Model']).not.toBeUndefined();
      } else if (Platform.OS === 'ios') {
        t.expect(exif['{TIFF}']['Make']).not.toBeUndefined();
        t.expect(exif['{TIFF}']['Model']).not.toBeUndefined();
      }
      t.expect(numberOfKeys).toBeGreaterThan(0);
      t.expect(exif).toBeDefined();
    });
  });

  t.describe('Listeners', () => {
    const WAIT_TIME = 2000;

    function timeoutWrapper(fn: () => void, time: number) {
      return new Promise((resolve) => {
        setTimeout(() => {
          fn();
          resolve(null);
        }, time);
      });
    }

    t.it('addListener is called when asset is created', async () => {
      const spy = t.jasmine.createSpy('addAsset spy', () => {});
      const subscription = addListener(spy);
      const asset = await Asset.create(pngFileLocalUri);

      t.expect(asset).not.toBeNull();
      await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);

      subscription.remove();
      assetsContainer.push(asset);
    });

    t.it('removed listener is not called', async () => {
      const spy = t.jasmine.createSpy('remove spy', () => {});
      const subscription = addListener(spy);
      subscription.remove();
      const asset = await Asset.create(pngFileLocalUri);

      t.expect(asset).not.toBeNull();
      await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);

      assetsContainer.push(asset);
    });

    t.it('addListener is called when asset is deleted', async () => {
      const spy = t.jasmine.createSpy('deleteAsset spy', () => {});
      const asset = await Asset.create(pngFileLocalUri);
      const subscription = addListener(spy);

      t.expect(asset).not.toBeNull();
      await Asset.delete([asset]);
      await timeoutWrapper(() => t.expect(spy).toHaveBeenCalled(), WAIT_TIME);
      subscription.remove();
    });

    t.it('removeAllListeners stops all listeners', async () => {
      const spy = t.jasmine.createSpy('removeAll spy', () => {});
      addListener(spy);
      removeAllListeners();

      const asset = await Asset.create(pngFileLocalUri);
      t.expect(asset).not.toBeNull();
      await timeoutWrapper(() => t.expect(spy).not.toHaveBeenCalled(), WAIT_TIME);

      assetsContainer.push(asset);
    });
  });

  function createAlbumName(name: string) {
    return name.replaceAll(' ', '_');
  }
}
