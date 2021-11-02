import { ActionResize } from '../ImageManipulator.types';
import { getContext } from '../utils/getContext.web';

/**
 * Hermite resize - fast image resize/resample using Hermite filter. 1 cpu version!
 * https://stackoverflow.com/a/18320662/4047926
 *
 * @param {HTMLCanvasElement} canvas
 * @param {int} width
 * @param {int} height
 * @param {boolean} resizeCanvas if true, canvas will be resized. Optional.
 */
function resampleSingle(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  resizeCanvas: boolean = false
): HTMLCanvasElement {
  const result = document.createElement('canvas');
  result.width = canvas.width;
  result.height = canvas.height;

  const widthSource = canvas.width;
  const heightSource = canvas.height;
  width = Math.round(width);
  height = Math.round(height);

  const wRatio = widthSource / width;
  const hRatio = heightSource / height;
  const wRatioHalf = Math.ceil(wRatio / 2);
  const hRatioHalf = Math.ceil(hRatio / 2);

  const ctx = getContext(canvas);

  const img = ctx.getImageData(0, 0, widthSource, heightSource);
  const img2 = ctx.createImageData(width, height);
  const data = img.data;
  const data2 = img2.data;

  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const x2 = (i + j * width) * 4;
      let weight = 0;
      let weights = 0;
      let weightsAlpha = 0;
      let gx_r = 0;
      let gx_g = 0;
      let gx_b = 0;
      let gx_a = 0;
      const yCenter = (j + 0.5) * hRatio;
      const yy_start = Math.floor(j * hRatio);
      const yy_stop = Math.ceil((j + 1) * hRatio);
      for (let yy = yy_start; yy < yy_stop; yy++) {
        const dy = Math.abs(yCenter - (yy + 0.5)) / hRatioHalf;
        const center_x = (i + 0.5) * wRatio;
        const w0 = dy * dy; //pre-calc part of w
        const xx_start = Math.floor(i * wRatio);
        const xx_stop = Math.ceil((i + 1) * wRatio);
        for (let xx = xx_start; xx < xx_stop; xx++) {
          const dx = Math.abs(center_x - (xx + 0.5)) / wRatioHalf;
          const w = Math.sqrt(w0 + dx * dx);
          if (w >= 1) {
            //pixel too far
            continue;
          }
          //hermite filter
          weight = 2 * w * w * w - 3 * w * w + 1;
          const xPosition = 4 * (xx + yy * widthSource);
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

  //resize canvas
  if (resizeCanvas) {
    result.width = width;
    result.height = height;
  }

  //draw
  const context = getContext(result);
  context.putImageData(img2, 0, 0);

  return result;
}

export default (canvas: HTMLCanvasElement, { width, height }: ActionResize['resize']) => {
  const imageRatio = canvas.width / canvas.height;

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

  return resampleSingle(canvas, requestedWidth, requestedHeight, true);
};
