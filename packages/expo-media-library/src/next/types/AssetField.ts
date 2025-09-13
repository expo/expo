import { MediaType } from './MediaType';

export enum AssetField {
  CREATION_TIME = 'creationTime',
  MODIFICATION_TIME = 'modificationTime',
  MEDIA_TYPE = 'mediaType',
  WIDTH = 'width',
  HEIGHT = 'height',
  DURATION = 'duration',
}

export type AssetFieldValueMap = {
  [AssetField.CREATION_TIME]: number;
  [AssetField.MODIFICATION_TIME]: number;
  [AssetField.MEDIA_TYPE]: MediaType;
  [AssetField.WIDTH]: number;
  [AssetField.HEIGHT]: number;
  [AssetField.DURATION]: number;
};
