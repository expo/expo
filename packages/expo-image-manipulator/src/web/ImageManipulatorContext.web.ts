import { SharedObject } from 'expo';

import { ActionCrop, ActionExtent, FlipType } from '../ImageManipulator.types';
import ImageManipulatorImageRef from './ImageManipulatorImageRef.web';
import { crop, extent, flip, resize, rotate } from './actions/index.web';

type ContextLoader = () => HTMLCanvasElement | Promise<HTMLCanvasElement>;

export default class ImageManipulatorContext extends SharedObject {
  private loader: ContextLoader;

  private _currentTask: Promise<HTMLCanvasElement> | undefined;
  get currentTask() {
    if (this._currentTask) {
      return this._currentTask;
    }
    this._currentTask = new Promise((resolve) => resolve(this.loader()));
    return this._currentTask;
  }
  set currentTask(task) {
    this._currentTask = task;
  }

  constructor(loader?: ContextLoader) {
    super();
    this.loader = loader ?? (() => document.createElement('canvas'));
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

    // We're copying the canvas so ref's `saveAsync` can safely use `toBlob` again with the desired format and quality.
    // The original canvas cannot be reused as the manipulator context may still draw on it.
    const clonedCanvas = document.createElement('canvas');
    const clonedCanvasCtx = clonedCanvas.getContext('2d');

    clonedCanvas.width = canvas.width;
    clonedCanvas.height = canvas.height;
    clonedCanvasCtx?.drawImage(canvas, 0, 0);

    return new Promise((resolve) => {
      // Create a full-sized, full-quality blob from the original canvas.
      canvas.toBlob(
        (blob) => {
          const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL();
          const image = new ImageManipulatorImageRef(url, clonedCanvas);

          resolve(image);
        },
        // Use PNG format so the result is of the best quality.
        // If you need another format, see `saveAsync` function on the image ref.
        'image/png'
      );
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
