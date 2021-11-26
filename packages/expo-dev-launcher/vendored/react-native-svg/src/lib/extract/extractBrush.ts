import extractColor, { integerColor } from './extractColor';
import { Color } from './types';

const urlIdPattern = /^url\(#(.+)\)$/;

const currentColorBrush = [2];
const contextFillBrush = [3];
const contextStrokeBrush = [4];

export default function extractBrush(color?: Color) {
  if (typeof color === 'number') {
    if (color >>> 0 === color && color >= 0 && color <= 0xffffffff) {
      return integerColor(color);
    }
  }

  if (!color || color === 'none') {
    return null;
  }

  if (color === 'currentColor') {
    return currentColorBrush;
  }

  if (color === 'context-fill') {
    return contextFillBrush;
  }

  if (color === 'context-stroke') {
    return contextStrokeBrush;
  }

  const brush = typeof color === 'string' && color.match(urlIdPattern);
  if (brush) {
    return [1, brush[1]];
  }

  const int32ARGBColor = extractColor(color);
  if (typeof int32ARGBColor === 'number') {
    return int32ARGBColor;
  }

  console.warn(`"${color}" is not a valid color or brush`);
  return null;
}
