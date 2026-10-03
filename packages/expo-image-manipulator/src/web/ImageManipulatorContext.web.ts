import { CodedError, SharedObject } from 'expo';

import type { ActionCrop, ActionExtent, FlipType } from '../ImageManipulator.types';
import ImageManipulatorImageRef from './ImageManipulatorImageRef.web';
import { crop, extent, flip, resize, rotate } from './actions/index.web';
import { releaseCanvas } from './utils.web';

type ContextLoader = () => HTMLCanvasElement | Promise<HTMLCanvasElement>;

export default class ImageManipulatorContext extends SharedObject {
  private loader: ContextLoader | undefined;
  private isReleased = false;

  private _currentTask: Promise<HTMLCanvasElement> | undefined;
  get currentTask() {
    this.ensureNotReleased();
    if (this._currentTask) {
      return this._currentTask;
    }
    this._currentTask = new Promise((resolve) => resolve(this.loader!()));
    return this._currentTask;
  }
  set currentTask(task) {
    this.ensureNotReleased();
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
    this.ensureNotReleased();
    const previousTask = this._currentTask;
    this.currentTask = new Promise((resolve) => resolve(this.loader!()));
    this.releaseTask(previousTask);
    return this;
  }

  release(): void {
    if (this.isReleased) {
      return;
    }
    this.isReleased = true;

    this.releaseTask(this._currentTask);
    this._currentTask = undefined;
    this.loader = undefined;
    super.release();
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
      // Encode the clone, which remains valid if the context is released or reset.
      clonedCanvas.toBlob(
        (blob) => {
          const url = blob ? URL.createObjectURL(blob) : clonedCanvas.toDataURL();
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
    this.currentTask = this.currentTask.then(async (canvas) => {
      try {
        const result = await task(canvas);
        if (result !== canvas) {
          releaseCanvas(canvas);
        }
        return result;
      } catch (error) {
        releaseCanvas(canvas);
        throw error;
      }
    });
    return this;
  }

  private ensureNotReleased(): void {
    if (this.isReleased) {
      throw new CodedError(
        'ERR_IMAGE_MANIPULATOR_RELEASED',
        'This image manipulation context was released by release() or by useImageManipulator when its source changed or its component unmounted. Create a new context with ImageManipulator.manipulate(...).'
      );
    }
  }

  private releaseTask(task: Promise<HTMLCanvasElement> | undefined): void {
    // Failed tasks clean up their own canvases.
    task?.then(releaseCanvas, () => {});
  }
}
