import type { MediaSubtype, MediaType } from './Asset.types';

export enum AssetField {
  CREATION_TIME = 'creationTime',
  MODIFICATION_TIME = 'modificationTime',
  MEDIA_TYPE = 'mediaType',
  WIDTH = 'width',
  HEIGHT = 'height',
  DURATION = 'duration',
  IS_FAVORITE = 'isFavorite',
  /**
   * @platform ios
   */
  MEDIA_SUBTYPES = 'mediaSubtypes',
}

export type AssetFieldValueMap = {
  [AssetField.CREATION_TIME]: number;
  [AssetField.MODIFICATION_TIME]: number;
  [AssetField.MEDIA_TYPE]: MediaType;
  [AssetField.WIDTH]: number;
  [AssetField.HEIGHT]: number;
  [AssetField.DURATION]: number;
  [AssetField.IS_FAVORITE]: boolean;
  [AssetField.MEDIA_SUBTYPES]: MediaSubtype[];
};

export type CollectionAssetField = AssetField.MEDIA_SUBTYPES;

export type SortableAssetField = Exclude<AssetField, CollectionAssetField>;

export type SortDescriptor = {
  key: SortableAssetField;
  ascending?: boolean;
};
