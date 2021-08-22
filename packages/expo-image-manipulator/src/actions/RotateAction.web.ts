import { ActionRotate } from '../ImageManipulator.types';
import { getContext } from '../utils/getContext.web';

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

export default (canvas: HTMLCanvasElement, degrees: ActionRotate['rotate']) => {
  const { width, height } = sizeFromAngle(canvas.width, canvas.height, degrees);

  const result = document.createElement('canvas');
  result.width = width;
  result.height = height;

  const context = getContext(result);

  // Set the origin to the center of the image
  context.translate(result.width / 2, result.height / 2);

  // Rotate the canvas around the origin
  const radians = (degrees * Math.PI) / 180;
  context.rotate(radians);

  // Draw the image
  context.drawImage(canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

  return result;
};
