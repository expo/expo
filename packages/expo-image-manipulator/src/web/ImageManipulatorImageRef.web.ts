import { SharedRef } from 'expo';

import type { ImageResult, SaveOptions } from '../ImageManipulator.types';
import { SaveFormat } from '../ImageManipulator.types';
import { blobToBase64String } from './utils.web';

export default class ImageManipulatorImageRef extends SharedRef<'image'> {
  readonly nativeRefType: string = 'image';

  readonly uri: string;
  readonly canvas: HTMLCanvasElement;

  constructor(uri: string, canvas: HTMLCanvasElement) {
    super();
    this.uri = uri;
    this.canvas = canvas;
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  async saveAsync(options: SaveOptions = { base64: false }): Promise<ImageResult> {
    return new Promise((resolve, reject) => {
      const requestedType = `image/${options.format ?? SaveFormat.JPEG}`;
      this.canvas.toBlob(
        async (blob) => {
          if (!blob) {
            return reject(new Error(`Unable to save image: ${this.uri}`));
          }
          if (blob.type !== requestedType) {
            return reject(
              new Error(
                `The browser does not support encoding "${requestedType}" images. Got "${blob.type}" instead. Try a different format like JPEG or PNG.`
              )
            );
          }
          const base64 = options.base64 ? await blobToBase64String(blob) : undefined;
          const uri = URL.createObjectURL(blob);

          resolve({
            uri,
            width: this.width,
            height: this.height,
            base64,
          });
        },
        requestedType,
        options.compress
      );
    });
  }
}
