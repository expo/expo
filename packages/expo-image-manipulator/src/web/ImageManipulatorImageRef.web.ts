import { SharedRef } from 'expo';

import type { ImageResult, SaveOptions } from '../ImageManipulator.types';
import { SaveFormat } from '../ImageManipulator.types';
import { blobToBase64String, releaseCanvas } from './utils.web';

export default class ImageManipulatorImageRef extends SharedRef<'image'> {
  readonly nativeRefType: string = 'image';
  private isReleased = false;

  readonly uri: string;
  readonly canvas: HTMLCanvasElement;

  constructor(uri: string, canvas: HTMLCanvasElement) {
    super();
    this.uri = uri;
    this.canvas = canvas;
  }

  get width() {
    this.ensureNotReleased();
    return this.canvas.width;
  }

  get height() {
    this.ensureNotReleased();
    return this.canvas.height;
  }

  async saveAsync(options: SaveOptions = { base64: false }): Promise<ImageResult> {
    this.ensureNotReleased();
    const width = this.width;
    const height = this.height;
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
            width,
            height,
            base64,
          });
        },
        requestedType,
        options.compress
      );
    });
  }

  release(): void {
    if (this.isReleased) {
      return;
    }
    this.isReleased = true;

    if (this.uri.toLowerCase().startsWith('blob:')) {
      URL.revokeObjectURL(this.uri);
    }
    releaseCanvas(this.canvas);
    super.release();
  }

  private ensureNotReleased(): void {
    if (this.isReleased) {
      throw new Error('Cannot use shared object that was already released');
    }
  }
}
