import { ActionFlip, FlipType } from '../ImageManipulator.types';
import { getContext } from '../utils/getContext.web';

export default (canvas: HTMLCanvasElement, flip: ActionFlip['flip']) => {
  const xFlip = flip === FlipType.Horizontal;
  const yFlip = flip === FlipType.Vertical;

  const result = document.createElement('canvas');
  result.width = canvas.width;
  result.height = canvas.height;

  const context = getContext(result);

  // Set the origin to the center of the image
  context.translate(canvas.width / 2, canvas.height / 2);

  // Flip/flop the canvas
  const xScale = xFlip ? -1 : 1;
  const yScale = yFlip ? -1 : 1;
  context.scale(xScale, yScale);

  // Draw the image
  context.drawImage(canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

  return result;
};
