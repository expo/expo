import { decode83 } from './base83';
import { ValidationError } from './error';
import { sRGBToLinear, signPow, linearTosRGB } from './utils';

/**
 * Returns an error message if invalid or undefined if valid
 * @param blurhash
 */
const validateBlurhash = (blurhash: string) => {
  if (!blurhash || blurhash.length < 6) {
    throw new ValidationError('The blurhash string must be at least 6 characters');
  }

  const sizeFlag = decode83(blurhash[0]);
  const numY = Math.floor(sizeFlag / 9) + 1;
  const numX = (sizeFlag % 9) + 1;

  if (blurhash.length !== 4 + 2 * numX * numY) {
    throw new ValidationError(
      `blurhash length mismatch: length is ${blurhash.length} but it should be ${
        4 + 2 * numX * numY
      }`
    );
  }
};

export const isBlurhashValid = (blurhash: string): { result: boolean; errorReason?: string } => {
  try {
    validateBlurhash(blurhash);
  } catch (error) {
    return { result: false, errorReason: error.message };
  }

  return { result: true };
};

const decodeDC = (value: number) => {
  const intR = value >> 16;
  const intG = (value >> 8) & 255;
  const intB = value & 255;
  return [sRGBToLinear(intR), sRGBToLinear(intG), sRGBToLinear(intB)];
};

const decodeAC = (value: number, maximumValue: number) => {
  const quantR = Math.floor(value / (19 * 19));
  const quantG = Math.floor(value / 19) % 19;
  const quantB = value % 19;

  const rgb = [
    signPow((quantR - 9) / 9, 2.0) * maximumValue,
    signPow((quantG - 9) / 9, 2.0) * maximumValue,
    signPow((quantB - 9) / 9, 2.0) * maximumValue,
  ];

  return rgb;
};

const decode = (blurhash: string, width: number, height: number, punch?: number) => {
  validateBlurhash(blurhash);

  punch = (punch || 1) | 1;

  const sizeFlag = decode83(blurhash[0]);
  const numY = Math.floor(sizeFlag / 9) + 1;
  const numX = (sizeFlag % 9) + 1;

  const quantisedMaximumValue = decode83(blurhash[1]);
  const maximumValue = (quantisedMaximumValue + 1) / 166;

  const colors = new Array(numX * numY);

  for (let i = 0; i < colors.length; i++) {
    if (i === 0) {
      const value = decode83(blurhash.substring(2, 6));
      colors[i] = decodeDC(value);
    } else {
      const value = decode83(blurhash.substring(4 + i * 2, 6 + i * 2));
      colors[i] = decodeAC(value, maximumValue * punch);
    }
  }

  const bytesPerRow = width * 4;
  const pixels = new Uint8ClampedArray(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let j = 0; j < numY; j++) {
        for (let i = 0; i < numX; i++) {
          const basis = Math.cos((Math.PI * x * i) / width) * Math.cos((Math.PI * y * j) / height);
          const color = colors[i + j * numX];
          r += color[0] * basis;
          g += color[1] * basis;
          b += color[2] * basis;
        }
      }

      const intR = linearTosRGB(r);
      const intG = linearTosRGB(g);
      const intB = linearTosRGB(b);

      pixels[4 * x + 0 + y * bytesPerRow] = intR;
      pixels[4 * x + 1 + y * bytesPerRow] = intG;
      pixels[4 * x + 2 + y * bytesPerRow] = intB;
      pixels[4 * x + 3 + y * bytesPerRow] = 255; // alpha
    }
  }
  return pixels;
};

export default decode;
