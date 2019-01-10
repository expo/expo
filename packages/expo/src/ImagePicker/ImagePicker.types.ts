export enum MediaTypeOptions {
  All = 'All',
  Videos = 'Videos',
  Images = 'Images',
}

export type ImageInfo = {
  uri: string;
  width: number;
  height: number;
};

export type ImageResult = { cancelled: true } | ({ cancelled: false } & ImageInfo);

export type PickerOptions = {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: MediaTypeOptions;
};

export type OpenFileBrowserOptions = {
  mediaTypes: MediaTypeOptions;
  capture?: boolean;
  allowsMultipleSelection: boolean;
};
