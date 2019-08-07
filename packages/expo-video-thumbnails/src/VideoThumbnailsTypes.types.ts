export type VideoThumbnailsResult = {
  uri: string;
  width: number;
  height: number;
};

export type ThumbnailOptions = {
  quality?: number;
  time?: number;
  headers?: { [fieldName: string]: string };
};
