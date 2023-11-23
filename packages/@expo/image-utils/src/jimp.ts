import fs from 'fs-extra';
// @ts-ignore
import Jimp from 'jimp-compact';
import * as path from 'path';

import {
  FlattenOptions,
  Position,
  ResizeOptions,
  SharpCommandOptions,
  SharpGlobalOptions,
} from './sharp.types';

type JimpGlobalOptions = Omit<SharpGlobalOptions, 'input'> & {
  input: string | Buffer | Jimp;
  originalInput: string;
};

export async function resizeBufferAsync(buffer: Buffer, sizes: number[]): Promise<Buffer[]> {
  return Promise.all(
    sizes.map(async size => {
      // Parse the buffer each time to prevent mutable copies.
      // Parse the buffer each time to prevent mutable copies.
      const jimpImage = await Jimp.read(buffer);
      const mime = jimpImage.getMIME();

      return jimpImage.resize(size, size).getBufferAsync(mime);
    })
  );
}

export function convertFormat(format?: string): string | undefined {
  if (typeof format === 'undefined') return format;

  const input = format?.toLowerCase();
  switch (input) {
    case 'png':
    case 'webp':
    case 'jpeg':
      return `image/${input}`;
    case 'jpg':
      return `image/jpeg`;
  }
  return undefined;
}

export async function jimpAsync(
  options: JimpGlobalOptions,
  commands: SharpCommandOptions[] = []
): Promise<Buffer> {
  if (commands.length) {
    const command = commands.shift();
    if (command) {
      let input: Jimp;
      if (command.operation === 'resize') {
        input = await resize(options, command);
      } else if (command.operation === 'flatten') {
        input = await flatten(options, command);
      } else {
        throw new Error(`The operation: '${command.operation}' is not supported with Jimp`);
      }
      // @ts-ignore
      return jimpAsync({ ...options, input }, commands);
    }
  }

  const image = await getJimpImageAsync(options.input);
  const mime = typeof options.format === 'string' ? options.format : image.getMIME();
  const imgBuffer = await image.getBufferAsync(mime);

  if (typeof options.output === 'string') {
    if (await isFolderAsync(options.output)) {
      await fs.writeFile(
        path.join(options.output, path.basename(options.originalInput)),
        imgBuffer
      );
    } else {
      await fs.writeFile(options.output, imgBuffer);
    }
  }
  return imgBuffer;
}

export async function isFolderAsync(path: string): Promise<boolean> {
  try {
    return (await fs.stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export function circleAsync(jimp: Jimp): Promise<Jimp> {
  const radius = Math.min(jimp.bitmap.width, jimp.bitmap.height) / 2;

  const center = {
    x: jimp.bitmap.width / 2,
    y: jimp.bitmap.height / 2,
  };

  return new Promise(resolve => {
    jimp.scanQuiet(
      0,
      0,
      jimp.bitmap.width,
      jimp.bitmap.height,
      (x: number, y: number, idx: number) => {
        const curR = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));

        if (radius - curR <= 0.0) {
          jimp.bitmap.data[idx + 3] = 0;
        } else if (radius - curR < 1.0) {
          jimp.bitmap.data[idx + 3] = 255 * (radius - curR);
        }
        resolve(jimp);
      }
    );
  });
}

export async function getJimpImageAsync(input: string | Buffer | Jimp): Promise<Jimp> {
  // @ts-ignore: Jimp types are broken
  if (typeof input === 'string' || input instanceof Buffer) return await Jimp.read(input);

  return input;
}

export async function resize(
  { input, quality = 100 }: JimpGlobalOptions,
  { background, position, fit, width, height }: Omit<ResizeOptions, 'operation'>
): Promise<Jimp> {
  let initialImage = await getJimpImageAsync(input);

  if (width && !height) {
    height = Jimp.AUTO;
  } else if (!width && height) {
    width = Jimp.AUTO;
  } else if (!width && !height) {
    width = initialImage.bitmap.width;
    height = initialImage.bitmap.height;
  }

  const jimpPosition = convertPosition(position);
  const jimpQuality = typeof quality !== 'number' ? 100 : quality;
  if (fit === 'cover') {
    initialImage = initialImage.cover(width, height, jimpPosition);
  } else if (fit === 'contain') {
    initialImage = initialImage.contain(width, height, jimpPosition);
  } else {
    throw new Error(
      `Unsupported fit: ${fit}. Please choose either 'cover', or 'contain' when using Jimp`
    );
  }
  if (background) {
    initialImage = initialImage.composite(new Jimp(width, height, background), 0, 0, {
      mode: Jimp.BLEND_DESTINATION_OVER,
      opacitySource: 1,
      opacityDest: 1,
    });
  }

  return await initialImage.quality(jimpQuality);
}

async function flatten(
  { input, quality = 100 }: JimpGlobalOptions,
  { background }: Omit<FlattenOptions, 'operation'>
): Promise<Jimp> {
  const initialImage = await getJimpImageAsync(input);
  const jimpQuality = typeof quality !== 'number' ? 100 : quality;
  return initialImage.quality(jimpQuality).background(Jimp.cssColorToHex(background));
}

/**
 * Convert sharp position to Jimp position.
 *
 * @param position
 */
function convertPosition(position?: Position): number {
  if (!position) return convertPosition('center');

  switch (position) {
    case 'center':
    case 'centre':
      return Jimp.VERTICAL_ALIGN_MIDDLE | Jimp.HORIZONTAL_ALIGN_CENTER;
    case 'north':
    case 'top':
      return Jimp.VERTICAL_ALIGN_TOP | Jimp.HORIZONTAL_ALIGN_CENTER;
    case 'east':
    case 'right':
      return Jimp.VERTICAL_ALIGN_MIDDLE | Jimp.HORIZONTAL_ALIGN_RIGHT;
    case 'south':
    case 'bottom':
      return Jimp.VERTICAL_ALIGN_BOTTOM | Jimp.HORIZONTAL_ALIGN_CENTER;
    case 'west':
    case 'left':
      return Jimp.VERTICAL_ALIGN_MIDDLE | Jimp.HORIZONTAL_ALIGN_LEFT;
    case 'northeast':
    case 'right top':
      return Jimp.VERTICAL_ALIGN_TOP | Jimp.HORIZONTAL_ALIGN_RIGHT;
    case 'southeast':
    case 'right bottom':
      return Jimp.VERTICAL_ALIGN_BOTTOM | Jimp.HORIZONTAL_ALIGN_RIGHT;
    case 'southwest':
    case 'left bottom':
      return Jimp.VERTICAL_ALIGN_BOTTOM | Jimp.HORIZONTAL_ALIGN_LEFT;
    case 'northwest':
    case 'left top':
      return Jimp.VERTICAL_ALIGN_TOP | Jimp.HORIZONTAL_ALIGN_LEFT;
    case 'entropy':
    case 'attention':
      throw new Error(`Position: '${position}' is not supported`);
    default:
      throw new Error(`Unknown position: '${position}'`);
  }
}
