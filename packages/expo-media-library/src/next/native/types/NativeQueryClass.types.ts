import type { AssetField, AssetFieldValueMap, AssetMetadata, SortDescriptor } from '../../types';
import type { NativeAlbumClass } from './NativeAlbumClass.types';
import type { NativeAssetClass } from './NativeAssetClass.types';

export declare class NativeQueryClass {
  constructor();
  eq<T extends AssetField>(field: T, value: AssetFieldValueMap[T]): NativeQueryClass;
  within<T extends AssetField>(field: T, value: AssetFieldValueMap[T][]): NativeQueryClass;
  gt(field: AssetField, value: number): NativeQueryClass;
  gte(field: AssetField, value: number): NativeQueryClass;
  lt(field: AssetField, value: number): NativeQueryClass;
  lte(field: AssetField, value: number): NativeQueryClass;
  limit(limit: number): NativeQueryClass;
  offset(offset: number): NativeQueryClass;
  orderBy(sortDescriptors: SortDescriptor | AssetField): NativeQueryClass;
  album(album: NativeAlbumClass): NativeQueryClass;
  exe(): Promise<NativeAssetClass[]>;
  exeForMetadata(): Promise<AssetMetadata[]>;
}
