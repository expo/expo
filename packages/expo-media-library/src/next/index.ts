import ExpoMediaLibraryNext from './ExpoMediaLibraryNext';
import { Platform } from 'react-native';

export class Asset extends ExpoMediaLibraryNext.Asset {
  static create(filePath: string, album?: Album): Promise<Asset> {
    return ExpoMediaLibraryNext.createAsset(filePath, album);
  }
  static deleteMany(assets: Array<Asset>): Promise<void> {
    return ExpoMediaLibraryNext.deleteManyAssets(assets);
  }
}

export class Album extends ExpoMediaLibraryNext.Album {
  static create(
    name: string,
    assetsRefs: string[] | Asset[],
    moveAssets: boolean = true
  ): Promise<Album> {
    if (Platform.OS === 'ios') {
      return ExpoMediaLibraryNext.createAlbum(name, assetsRefs);
    }
    return ExpoMediaLibraryNext.createAlbum(name, assetsRefs, moveAssets);
  }
  static deleteMany(albums: Array<Album>, deleteAssets: Boolean = false): Promise<void> {
    if (Platform.OS === 'ios') {
      return ExpoMediaLibraryNext.deleteManyAlbums(albums, deleteAssets);
    } else {
      return ExpoMediaLibraryNext.deleteManyAlbums(albums);
    }
  }
  static getAll(): Promise<Array<Album>> {
    return ExpoMediaLibraryNext.getAllAlbums();
  }
}
