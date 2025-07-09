import { SharedRef } from 'expo';

import { ImageResult, SaveFormat, SaveOptions } from '../ImageManipulator.types';
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
      this.canvas.toBlob(
        async (blob) => {
          if (!blob) {
            return reject(new Error(`Unable to save image: ${this.uri}`));
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
        `image/${options.format ?? SaveFormat.JPEG}`,
        options.compress
      );
    });
  }
}
