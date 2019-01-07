import MediaTypeOptions from './MediaTypeOptions';

export type ImageInfo = {
  uri: string;
  width: number;
  height: number;
};

export type ImageResult = { cancelled: true } | ({ cancelled: false } & ImageInfo);

export type ImageLibraryOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: keyof (typeof MediaTypeOptions);
};

export type CameraOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: keyof (typeof MediaTypeOptions);
};
