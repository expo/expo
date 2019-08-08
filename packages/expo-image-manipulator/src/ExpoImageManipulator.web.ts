import { CodedError } from '@unimodules/core';
import {
  ImageResult,
  SaveOptions,
  Action,
  ActionCrop,
  ActionResize,
  ActionFlip,
  ActionRotate,
  FlipType,
} from './ImageManipulator.types';

/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * https://stackoverflow.com/a/18320662/4047926
 *
 * @param {HtmlElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resizeCanvas if true, canvas will be resized. Optional.
 */
function resampleSingle(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  resizeCanvas: boolean = false
): void {
  const widthSource = canvas.width;
  const heightSource = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  const wRatio = widthSource / width;
  const hRatio = heightSource / height;
  const wRatioHalf = Math.ceil(wRatio / 2);
  const hRatioHalf = Math.ceil(hRatio / 2);

  let ctx = getContext(canvas);

  let img = ctx.getImageData(0, 0, widthSource, heightSource);
  let img2 = ctx.createImageData(width, height);
  let data = img.data;
  let data2 = img2.data;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      let x2 = (i + j * width) * 4;
      let weight = 0;
      let weights = 0;
      let weightsAlpha = 0;
      let gx_r = 0;
      let gx_g = 0;
      let gx_b = 0;
      let gx_a = 0;
      let yCenter = (j + 0.5) * hRatio;
      let yy_start = Math.floor(j * hRatio);
      let yy_stop = Math.ceil((j + 1) * hRatio);
      for (let yy = yy_start; yy < yy_stop; yy++) {
        let dy = Math.abs(yCenter - (yy + 0.5)) / hRatioHalf;
        let center_x = (i + 0.5) * wRatio;
        let w0 = dy * dy; //pre-calc part of w
        let xx_start = Math.floor(i * wRatio);
        let xx_stop = Math.ceil((i + 1) * wRatio);
        for (let xx = xx_start; xx < xx_stop; xx++) {
          let dx = Math.abs(center_x - (xx + 0.5)) / wRatioHalf;
          let w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            //pixel too far
            continue;
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          let xPosition = 4 * (xx + yy * widthSource);
          //alpha
          gx_a += weight * data[xPosition + 3];
          weightsAlpha += weight;
          //colors
          if (data[xPosition + 3] < 255) {
            weight = (weight * data[xPosition + 3]) / 250;
          }
          gx_r += weight * data[xPosition];
          gx_g += weight * data[xPosition + 1];
          gx_b += weight * data[xPosition + 2];
          weights += weight;
        }
      }
      data2[x2] = gx_r / weights;
      data2[x2 + 1] = gx_g / weights;
      data2[x2 + 2] = gx_b / weights;
      data2[x2 + 3] = gx_a / weightsAlpha;
    }
  }
  //clear and resize canvas
  if (resizeCanvas) {
    canvas.width = width;
    canvas.height = height;
  } else {
    ctx.clearRect(0, 0, widthSource, heightSource);
  }

  //draw
  ctx.putImageData(img2, 0, 0);
}

function sizeFromAngle(
  width: number,
  height: number,
  angle: number
): { width: number; height: number } {
  const radians = (angle * Math.PI) / 180;
  let c = Math.cos(radians);
  let s = Math.sin(radians);
  if (s < 0) {
    s = -s;
  }
  if (c < 0) {
    c = -c;
  }
  return { width: height * s + width * c, height: height * c + width * s };
}

function cropImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  x: number = 0,
  y: number = 0,
  width: number = 0,
  height: number = 0
): void {
  const context = getContext(canvas);
  context.save();
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
}

function drawImage(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  x: number = 0,
  y: number = 0,
  angle: number = 0,
  xFlip: boolean = false,
  yFlip: boolean = false,
  width?: number,
  height?: number
): CanvasRenderingContext2D {
  const context = getContext(canvas);
  context.save();

  if (width == null) {
    width = img.naturalWidth as number;
  }
  if (height == null) {
    height = img.naturalHeight as number;
  }

  // Set the origin to the center of the image
  context.translate(x + canvas.width / 2, y + canvas.height / 2);

  // Rotate the canvas around the origin
  const radians = 2 * Math.PI - (angle * Math.PI) / 180;
  context.rotate(radians);

  // Flip/flop the canvas
  const xScale = xFlip ? -1 : 1;
  const yScale = yFlip ? -1 : 1;

  context.scale(xScale, yScale);

  // Draw the image
  context.drawImage(
    img,
    -img.naturalWidth / 2,
    -img.naturalHeight / 2,
    img.naturalWidth,
    img.naturalHeight
  );

  context.restore();
  return context;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
  }
  return ctx;
}

function getResults(canvas: HTMLCanvasElement, options?: SaveOptions): ImageResult {
  let base64;
  if (options) {
    const { format = 'png' } = options;
    if (options.format === 'png' && options.compress !== undefined) {
      console.warn('compress is not supported with png format.');
    }
    const quality = Math.min(1, Math.max(0, options.compress || 1));
    base64 = canvas.toDataURL('image/' + format, quality);
  } else {
    // defaults to PNG with no loss
    base64 = canvas.toDataURL();
  }
  return {
    uri: base64,
    width: canvas.width,
    height: canvas.height,
    base64,
  };
}

function loadImageAsync(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageSource = new Image();
    imageSource.onload = () => resolve(imageSource);
    imageSource.onerror = () => reject(imageSource);
    imageSource.src = uri;
  });
}

async function manipulateWithActionAsync(
  uri: string,
  action: Action,
  options: SaveOptions
): Promise<ImageResult> {
  let canvas = document.createElement('canvas');
  const imageSource = await loadImageAsync(uri);
  canvas.width = imageSource.naturalWidth;
  canvas.height = imageSource.naturalHeight;

  if ((action as ActionCrop).crop) {
    const { crop } = action as ActionCrop;
    // ensure values are defined.
    let { originX = 0, originY = 0, width = 0, height = 0 } = crop;
    const clamp = (value, max) => Math.max(0, Math.min(max, value));
    // lock within bounds.
    width = clamp(width, canvas.width);
    height = clamp(height, canvas.height);
    originX = clamp(originX, canvas.width);
    originY = clamp(originY, canvas.height);

    // lock sum of crop.
    width = Math.min(originX + width, canvas.width);
    height = Math.min(originY + height, canvas.height);

    if (originX - width === 0 || originY - height === 0) {
      throw new CodedError(
        'ERR_IMAGE_MANIPULATOR_CROP',
        'Crop size must be greater than 0: ' + JSON.stringify(crop, null, 2)
      );
    }

    // change size of canvas.
    canvas.width = width;
    canvas.height = height;

    cropImage(canvas, imageSource, originX, originY, width, height);
  } else if ((action as ActionResize).resize) {
    const { resize } = action as ActionResize;
    const { width, height } = resize;

    const imageRatio = imageSource.naturalWidth / imageSource.naturalHeight;

    let requestedWidth: number = 0;
    let requestedHeight: number = 0;
    if (width !== undefined) {
      requestedWidth = width;
      requestedHeight = requestedWidth / imageRatio;
    }
    if (height !== undefined) {
      requestedHeight = height;
      if (requestedWidth === 0) {
        requestedWidth = requestedHeight * imageRatio;
      }
    }

    const context = getContext(canvas);
    context.save();
    context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);

    resampleSingle(canvas, requestedWidth, requestedHeight, true);
  } else if ((action as ActionFlip).flip !== undefined) {
    const { flip } = action as ActionFlip;
    const xFlip = flip === FlipType.Horizontal;
    const yFlip = flip === FlipType.Vertical;
    drawImage(canvas, imageSource, 0, 0, 0, xFlip, yFlip);
  } else if ((action as ActionRotate).rotate !== undefined) {
    const { rotate } = action as ActionRotate;
    const { width, height } = sizeFromAngle(
      imageSource.naturalWidth,
      imageSource.naturalHeight,
      rotate
    );
    canvas.width = width;
    canvas.height = height;
    drawImage(canvas, imageSource, 0, 0, rotate, false, false, width, height);
  } else {
    const context = getContext(canvas);
    context.save();
    context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
  }
  return getResults(canvas, options);
}

export default {
  get name(): string {
    return 'ExpoImageManipulator';
  },
  async manipulateAsync(
    uri: string,
    actions: Action[] = [],
    options: SaveOptions
  ): Promise<ImageResult> {
    if (!actions.length) {
      let canvas = document.createElement('canvas');
      const imageSource = await loadImageAsync(uri);
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      const ctx = getContext(canvas);
      ctx.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);
      return getResults(canvas, options);
    } else {
      let output: ImageResult;
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        let _options;
        if (i === actions.length - 1) {
          _options = options;
        }
        output = await manipulateWithActionAsync(uri || output!.uri, action, _options);
      }
      return output!;
    }
  },
};
