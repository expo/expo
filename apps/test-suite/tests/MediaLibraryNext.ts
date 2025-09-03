import { Asset as ExpoAsset } from 'expo-asset';
import {
  Asset,
  Album,
  requestPermissionsAsync,
  Query,
  MediaType,
  AssetField,
} from 'expo-media-library/next';

import { Platform } from 'react-native';

export const name = 'MediaLibrary@Next';

const mp3Path = require('../assets/LLizard.mp3');
const mp4Path = require('../assets/big_buck_bunny.mp4');
const pngPath = require('../assets/icons/app.png');
const jpgPath = require('../assets/qrcode_expo.jpg');

export async function test(t) {
  let permissions;
  let files, filesWithAudio;
  let jpgFile, pngFile, mp4File, mp3File;

  const checkIfAllPermissionsWereGranted = () => {
    if (Platform.OS === 'ios') {
      return permissions.accessPrivileges === 'all';
    }
    return permissions.granted;
  };

  t.beforeAll(async () => {
    [mp3File] = await ExpoAsset.loadAsync(mp3Path);
    [pngFile] = await ExpoAsset.loadAsync(pngPath);
    [jpgFile] = await ExpoAsset.loadAsync(jpgPath);
    [mp4File] = await ExpoAsset.loadAsync(mp4Path);
    files = [pngFile, jpgFile, mp4File];
    filesWithAudio = [pngFile, jpgFile, mp4File, mp3File];
    permissions = await requestPermissionsAsync();
    if (!checkIfAllPermissionsWereGranted()) {
      console.warn('Tests will fail - not enough permissions to run them.');
    }
  });

  let albumsContainer = [];
  let assetsContainer = [];

  t.afterAll(async () => {
    await Album.delete(albumsContainer.flat(), true);
    await Asset.delete(assetsContainer.flat());
    albumsContainer = [];
    assetsContainer = [];
  });

  t.describe('Album creation', () => {
    t.it('creates an album from a list of paths', async () => {
      const albumName = createAlbumName('album from paths');
      const album = await Album.create(
        albumName,
        files.map((f) => f.localUri)
      );
      albumsContainer.push(album);

      const assets = await album.getAssets();
      t.expect(assets.length).toBe(files.length);
      t.expect(await album.getTitle()).toBe(albumName);
    });

    t.it('creates an album from a list of assets', async () => {
      // given
      const assets = await Promise.all(files.map((f) => Asset.create(f.localUri)));
      assetsContainer.push(...assets);
      const albumName = createAlbumName('album from assets');

      // when
      const album = await Album.create(albumName, assets);
      albumsContainer.push(album);

      // then
      t.expect(assets.length).toBe(files.length);
      t.expect(await album.getTitle()).toBe(albumName);
      const fetchedAssets = await album.getAssets();
      if (Platform.OS === 'android' && Platform.Version >= 29) {
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
        const assets = await Promise.all(files.map((f) => Asset.create(f.localUri)));
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
        const assets = await Promise.all(files.map((f) => Asset.create(f.localUri)));
        assetsContainer.push(...assets);
        const oldAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        const albumName = createAlbumName('album from assets copy');

        // when
        const album = await Album.create(albumName, assets, false);

        // then
        const newAssetUris = await Promise.all(assets.map((asset) => asset.getUri()));
        albumsContainer.push(album);
        if (Platform.OS === 'android' && Platform.Version >= 29) {
          for (const oldAssetUri of oldAssetUris) {
            t.expect(newAssetUris.findIndex((uri) => uri === oldAssetUri)).not.toBe(-1);
          }
        } else {
          t.expect();
        }
      });
    }

    t.it('fails when mixing audio and images', async () => {
      try {
        const albumName = createAlbumName('mixed audio & image');
        const assets = await Promise.all(filesWithAudio.map((f) => Asset.create(f.localUri)));
        assetsContainer.push(assets);
        const album = await Album.create(albumName, assets);
        albumsContainer.push(album);
        t.fail();
      } catch (e) {
        t.expect(e).toBeDefined();
      }
    });
  });

  t.describe('Asset creation', () => {
    t.it('creates a PNG asset', async () => {
      const asset = await Asset.create(pngFile.localUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    if (Platform.OS === 'ios') {
      t.it('fails when creating an MP3 asset', async () => {
        try {
          const asset = await Asset.create(mp3File.localUri);
          assetsContainer.push(asset);
          t.fail();
        } catch (e) {
          t.expect(e).toBeDefined();
        }
      });
    } else {
      t.it('creates an MP3 asset', async () => {
        const asset = await Asset.create(mp3File.localUri);
        assetsContainer.push(asset);
        t.expect(asset.id).toBeDefined();
      });
    }

    t.it('creates an MP4 asset', async () => {
      const asset = await Asset.create(mp4File.localUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    t.it('creates a JPG asset', async () => {
      const asset = await Asset.create(jpgFile.localUri);
      assetsContainer.push(asset);
      t.expect(asset.id).toBeDefined();
    });

    t.it('creates an asset inside an album', async () => {
      const albumName = createAlbumName('asset inside album');
      const firstAsset = await Asset.create(jpgFile.localUri);
      assetsContainer.push(firstAsset);
      const album = await Album.create(albumName, [firstAsset]);
      albumsContainer.push(album);

      const newAsset = await Asset.create(jpgFile.localUri, album);
      assetsContainer.push(newAsset);

      t.expect(newAsset.id).toBeDefined();
      const assets = await album.getAssets();
      const assetIds = assets.map((a) => a.id);
      t.expect(assetIds).toContain(newAsset.id);
    });
  });

  t.describe('Album deletion', () => {
    t.it('deletes an album', async () => {
      const albumName = createAlbumName('album deletion');
      const album = await Album.create(albumName, [jpgFile.localUri], true);
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
      const album = await Album.create(albumName, [jpgFile.localUri], true);
      albumsContainer.push(album);

      const newAsset = await Asset.create(files[1].localUri);
      const oldUri = await newAsset.getUri();
      const oldId = newAsset.id;
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
  });

  t.describe('Image asset properties', () => {
    let asset: Asset;

    t.beforeEach(async () => {
      asset = await Asset.create(pngFile.localUri);
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

    t.it('returns a media type', async () => {
      const mediaType = await asset.getMediaType();
      t.expect(mediaType).toBeDefined();
    });

    t.it('returns positive modification time', async () => {
      const modificationTime = await asset.getModificationTime();
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
  });

  t.describe('Video asset properties', () => {
    let videoAsset: Asset;

    t.beforeEach(async () => {
      videoAsset = await Asset.create(mp4File.localUri);
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

    t.it('returns positive modification time', async () => {
      const modificationTime = await videoAsset.getModificationTime();
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
      const createdAssets = await Promise.all(files.map((f) => Asset.create(f.localUri)));
      assetsContainer.push(...createdAssets);
      // when
      const assets = await new Query().limit(3).exe();
      // then
      t.expect(assets.length).toBe(3);
      t.expect(assets[0].id).not.toBe(null);
    });

    t.it('offset works correctly', async () => {
      // given
      const createdAssets = await Promise.all(files.map((f) => Asset.create(f.localUri)));
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

    t.it('offset outside of bounds works correctly', async () => {
      // given
      const asset = await Asset.create(pngFile.localUri);
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
      const asset = await Asset.create(pngFile.localUri);
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
      const asset = await Asset.create(mp4File.localUri);
      assetsContainer.push(asset);
      // when
      const [videoAsset] = await new Query()
        .limit(1)
        .in_(AssetField.MEDIA_TYPE, [MediaType.VIDEO])
        .exe();
      // then
      t.expect(await videoAsset.getMediaType()).toBe(MediaType.VIDEO);
    });

    if (Platform.OS !== 'ios') {
      t.it('mediatype audio works correctly', async () => {
        // given
        const asset = await Asset.create(mp3File.localUri);
        assetsContainer.push(asset);
        // when
        const query = new Query().limit(1).in_(AssetField.MEDIA_TYPE, [MediaType.AUDIO]);
        const [audioAsset] = await query.exe();
        // then
        t.expect(await audioAsset.getMediaType()).toBe(MediaType.AUDIO);
      });
    }

    t.it('album works correctly', async () => {
      // given
      const albumName = createAlbumName('album works correctly');
      const asset = await Asset.create(mp4File.localUri);
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
      const asset = await Asset.create(pngFile.localUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [queriedAsset] = await new Query()
        .limit(1)
        .album(album)
        .gte(AssetField.MODIFICATION_TIME, (await asset.getModificationTime()) - 1)
        .lte(AssetField.MODIFICATION_TIME, (await asset.getModificationTime()) + 1)
        .exe();
      // then
      t.expect(queriedAsset.id).toBe(asset.id);
    });

    t.it('height and gte work correctly', async () => {
      // given
      const albumName = createAlbumName('height and gte work correctly');
      const asset = await Asset.create(pngFile.localUri);
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
      const asset = await Asset.create(pngFile.localUri);
      assetsContainer.push(asset);
      const album = await Album.create(albumName, [asset]);
      albumsContainer.push(album);
      // when
      const [queriedAsset] = await new Query()
        .limit(1)
        .album(album)
        .gte(AssetField.MODIFICATION_TIME, (await asset.getModificationTime()) + 1)
        .lte(AssetField.MODIFICATION_TIME, (await asset.getModificationTime()) - 1)
        .exe();
      // then
      t.expect(queriedAsset).toBeUndefined();
    });

    t.it('creation time works correctly', async () => {
      // given
      const albumName = createAlbumName('album works correctly');
      const asset = await Asset.create(mp4File.localUri);
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
      const shorterAsset = await Asset.create(pngFile.localUri);
      const tallerAsset = await Asset.create(jpgFile.localUri);
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
      const videoAsset = await Asset.create(mp4File.localUri);
      const photoAsset = await Asset.create(jpgFile.localUri);
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
      const videoAsset = await Asset.create(mp4File.localUri);
      const shorterAsset = await Asset.create(pngFile.localUri);
      const tallerAsset = await Asset.create(jpgFile.localUri);
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
      const videoAsset = await Asset.create(mp4File.localUri);
      const shorterAsset = await Asset.create(pngFile.localUri);
      const tallerAsset = await Asset.create(jpgFile.localUri);
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
  });

  function createAlbumName(name: string) {
    return name.replaceAll(' ', '_');
  }
}
