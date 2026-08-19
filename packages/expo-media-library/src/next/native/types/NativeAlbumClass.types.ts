import type { NativeAssetClass } from './NativeAssetClass.types';

export declare class NativeAlbumClass {
  constructor(id: string);
  id: string;
  getAssets(): Promise<NativeAssetClass[]>;
  getTitle(): Promise<string>;
  delete(): Promise<void>;
  add(assets: NativeAssetClass | NativeAssetClass[]): Promise<void>;
  removeAssets(assets: NativeAssetClass[]): Promise<void>;
  static create(
    name: string,
    assetsRefs: string[] | NativeAssetClass[],
    moveAssets?: boolean
  ): Promise<NativeAlbumClass>;
  static delete(albums: NativeAlbumClass[], deleteAssets?: boolean): Promise<void>;
  static get(title: string): Promise<NativeAlbumClass | null>;
  static getAll(): Promise<NativeAlbumClass[]>;
}
