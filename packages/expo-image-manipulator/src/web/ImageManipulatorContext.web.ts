import { SharedObject } from 'expo';

import ImageManipulatorImageRef from './ImageManipulatorImageRef.web';
import { ActionCrop, ActionExtent, FlipType } from '../ImageManipulator.types';
import { crop, extent, flip, resize, rotate } from './actions/index.web';

type ContextLoader = () => HTMLCanvasElement | Promise<HTMLCanvasElement>;

export default class ImageManipulatorContext extends SharedObject {
  private loader: ContextLoader;
  private currentTask: Promise<HTMLCanvasElement>;

  constructor(loader?: ContextLoader) {
    super();
    this.loader = loader ?? (() => document.createElement('canvas'));
    this.currentTask = new Promise((resolve) => resolve(this.loader()));
  }

  resize(size: { width: number; height: number }): ImageManipulatorContext {
    return this.addTask((canvas) => resize(canvas, size));
  }

  rotate(degrees: number): ImageManipulatorContext {
    return this.addTask((canvas) => rotate(canvas, degrees));
  }

  flip(flipType: FlipType): ImageManipulatorContext {
    return this.addTask((canvas) => flip(canvas, flipType));
  }

  crop(rect: ActionCrop['crop']): ImageManipulatorContext {
    return this.addTask((canvas) => crop(canvas, rect));
  }

  extent(options: ActionExtent['extent']): ImageManipulatorContext {
    return this.addTask((canvas) => extent(canvas, options));
  }

  reset(): ImageManipulatorContext {
    this.currentTask = new Promise((resolve) => resolve(this.loader()));
    return this;
  }

  async renderAsync(): Promise<ImageManipulatorImageRef> {
    const canvas = await this.currentTask;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL();

        resolve(new ImageManipulatorImageRef(url, canvas.width, canvas.height));
      });
    });
  }

  private addTask(
    task: (canvas: HTMLCanvasElement) => HTMLCanvasElement | Promise<HTMLCanvasElement>
  ): ImageManipulatorContext {
    this.currentTask = this.currentTask.then((canvas) => {
      return task(canvas);
    });
    return this;
  }
}
