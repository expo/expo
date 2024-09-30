import { SharedRef } from 'expo';

import { getResults } from './utils.web';
import { ImageResult, SaveFormat, SaveOptions } from '../ImageManipulator.types';

export default class ImageManipulatorImageRef extends SharedRef<'image'> {
  private canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
  }

  async saveAsync(options: SaveOptions = { format: SaveFormat.PNG }): Promise<ImageResult> {
    return getResults(this.canvas, options);
  }
}
