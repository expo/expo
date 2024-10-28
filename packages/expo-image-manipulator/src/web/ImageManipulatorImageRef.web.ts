import { SharedRef } from 'expo';

import { ImageResult, SaveOptions } from '../ImageManipulator.types';
import { blobToBase64String } from './utils.web';

export default class ImageManipulatorImageRef extends SharedRef<'image'> {
  readonly nativeRefType: string = 'image';

  readonly uri: string;
  readonly width: number;
  readonly height: number;

  constructor(uri: string, width: number, height: number) {
    super();
    this.uri = uri;
    this.width = width;
    this.height = height;
  }

  async saveAsync(options: SaveOptions = { base64: false }): Promise<ImageResult> {
    return {
      uri: this.uri,
      width: this.width,
      height: this.height,
      base64: options.base64
        ? await blobToBase64String(await fetch(this.uri).then((response) => response.blob()))
        : undefined,
    };
  }
}
