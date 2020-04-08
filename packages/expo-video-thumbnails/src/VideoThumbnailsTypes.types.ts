export type VideoThumbnailsResult = {
  uri: string;
  width: number;
  height: number;
};

export type VideoThumbnailsOptions = {
  quality?: number;
  time?: number;
  headers?: { [fieldName: string]: string };
};
