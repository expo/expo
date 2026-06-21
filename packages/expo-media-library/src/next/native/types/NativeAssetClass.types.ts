import type { NativeAlbumClass } from './NativeAlbumClass.types';
import type { AssetInfo, Location, Shape, MediaSubtype, MediaType } from '../../types';

export declare class NativeAssetClass {
  constructor(id: string);
  id: string;
  getCreationTime(): Promise<number | null>;
  getDuration(): Promise<number | null>;
  getFilename(): Promise<string>;
  getHeight(): Promise<number>;
  getMediaType(): Promise<MediaType>;
  getMediaSubtypes(): Promise<MediaSubtype[]>;
  getLivePhotoVideoUri(): Promise<string | null>;
  getIsInCloud(): Promise<boolean>;
  getOrientation(): Promise<number | null>;
  getModificationTime(): Promise<number | null>;
  getShape(): Promise<Shape | null>;
  getUri(): Promise<string>;
  getWidth(): Promise<number>;
  getInfo(): Promise<AssetInfo>;
  getAlbums(): Promise<NativeAlbumClass[]>;
  getLocation(): Promise<Location | null>;
  getExif(): Promise<{ [key: string]: any }>;
  delete(): Promise<void>;
  getFavorite(): Promise<boolean>;
  setFavorite(isFavorite: boolean): Promise<void>;
  static create(filePath: string, album?: NativeAlbumClass): Promise<NativeAssetClass>;
  static delete(assets: NativeAssetClass[]): Promise<void>;
}
