import { SharedRef } from 'expo';

import { ImageRef } from '../Image.types';

export default class ImageRefWeb extends SharedRef<'image'> implements ImageRef {
  override nativeRefType = 'image';

  uri: string | null = null;
  width: number = 0;
  height: number = 0;
  mediaType: string | null = null;
  scale: number = 1;
  isAnimated: boolean = false;

  static init(uri: string, width: number, height: number, mediaType: string | null): ImageRefWeb {
    return Object.assign(new ImageRefWeb(), {
      uri,
      width,
      height,
      mediaType,
      isAnimated: mediaType === 'image/gif',
    });
  }
}
