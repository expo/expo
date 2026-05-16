import { SharedRef } from 'expo';

type VideoThumbnailInit = {
  uri: string;
  width: number;
  height: number;
  requestedTime: number;
  actualTime: number;
};

export default class VideoThumbnailWeb extends SharedRef<'image'> {
  override nativeRefType = 'image';

  uri: string | null = null;
  width: number = 0;
  height: number = 0;
  requestedTime: number = 0;
  actualTime: number = 0;

  static init({
    uri,
    width,
    height,
    requestedTime,
    actualTime,
  }: VideoThumbnailInit): VideoThumbnailWeb {
    return Object.assign(new VideoThumbnailWeb(), {
      uri,
      width,
      height,
      requestedTime,
      actualTime,
    });
  }
}
