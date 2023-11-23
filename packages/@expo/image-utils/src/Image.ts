import chalk from 'chalk';
import fs from 'fs';
import mime from 'mime';
import parsePng from 'parse-png';

import * as Cache from './Cache';
import * as Download from './Download';
import * as Ico from './Ico';
import { ImageOptions } from './Image.types';
import { env } from './env';
import * as Jimp from './jimp';
import * as Sharp from './sharp';

const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

let hasWarned: boolean = false;

async function resizeImagesAsync(buffer: Buffer, sizes: number[]): Promise<Buffer[]> {
  const sharp = await getSharpAsync();
  if (!sharp) {
    return Jimp.resizeBufferAsync(buffer, sizes);
  }
  return Sharp.resizeBufferAsync(buffer, sizes);
}

async function resizeAsync(imageOptions: ImageOptions): Promise<Buffer> {
  const sharp: any = await getSharpAsync();
  const { width, height, backgroundColor, resizeMode } = imageOptions;
  if (!sharp) {
    const inputOptions: any = { input: imageOptions.src, quality: 100 };
    const jimp = await Jimp.resize(inputOptions, {
      width,
      height,
      fit: resizeMode,
      background: backgroundColor,
    });

    if (imageOptions.removeTransparency) {
      jimp.colorType(2);
    }
    if (imageOptions.borderRadius) {
      // TODO: support setting border radius with Jimp. Currently only support making the image a circle
      await Jimp.circleAsync(jimp);
    }

    // Convert to png buffer
    return jimp.getBufferAsync('image/png');
  }
  try {
    let sharpBuffer = sharp(imageOptions.src)
      .ensureAlpha()
      .resize(width, height, { fit: resizeMode, background: 'transparent' });

    // Skip an extra step if the background is explicitly transparent.
    if (backgroundColor && backgroundColor !== 'transparent') {
      // Add the background color to the image
      sharpBuffer = sharpBuffer.composite([
        {
          // create a background color
          input: {
            create: {
              width,
              height,
              // allow alpha colors
              channels: imageOptions.removeTransparency ? 3 : 4,
              background: backgroundColor,
            },
          },
          // dest-over makes the first image (input) appear on top of the created image (background color)
          blend: 'dest-over',
        },
      ]);
    } else if (imageOptions.removeTransparency) {
      sharpBuffer.flatten();
    }

    if (imageOptions.borderRadius) {
      const mask = Buffer.from(
        `<svg><rect x="0" y="0" width="${width}" height="${height}"
        rx="${imageOptions.borderRadius}" ry="${imageOptions.borderRadius}"
        fill="${
          backgroundColor && backgroundColor !== 'transparent' ? backgroundColor : 'none'
        }" /></svg>`
      );

      sharpBuffer.composite([{ input: mask, blend: 'dest-in' }]);
    }

    return await sharpBuffer.png().toBuffer();
  } catch ({ message }) {
    throw new Error(
      `It was not possible to generate splash screen '${imageOptions.src}'. ${message}`
    );
  }
}

async function getSharpAsync(): Promise<any> {
  let sharp: any;
  if (await Sharp.isAvailableAsync()) sharp = await Sharp.findSharpInstanceAsync();
  return sharp;
}

function getDimensionsId(imageOptions: Pick<ImageOptions, 'width' | 'height'>): string {
  return imageOptions.width === imageOptions.height
    ? `${imageOptions.width}`
    : `${imageOptions.width}x${imageOptions.height}`;
}

async function maybeWarnAboutInstallingSharpAsync() {
  // Putting the warning here will prevent the warning from showing if all images were reused from the cache
  if (env.EXPO_IMAGE_UTILS_DEBUG && !hasWarned && !(await Sharp.isAvailableAsync())) {
    hasWarned = true;
    console.warn(
      chalk.yellow(
        `Using node to generate images. This is much slower than using native packages.\n\u203A Optionally you can stop the process and try again after successfully running \`npm install -g sharp-cli\`.\n`
      )
    );
  }
}

async function ensureImageOptionsAsync(imageOptions: ImageOptions): Promise<ImageOptions> {
  const icon = {
    ...imageOptions,
    src: await Download.downloadOrUseCachedImage(imageOptions.src),
  };

  // Default to contain
  if (!icon.resizeMode) {
    icon.resizeMode = 'contain';
  }

  const mimeType = mime.getType(icon.src);

  if (!mimeType) {
    throw new Error(`Invalid mimeType for image with source: ${icon.src}`);
  }
  if (!supportedMimeTypes.includes(mimeType)) {
    throw new Error(`Supplied image is not a supported image type: ${imageOptions.src}`);
  }

  if (!icon.name) {
    icon.name = `icon_${getDimensionsId(imageOptions)}.${mime.getExtension(mimeType)}`;
  }

  return icon;
}

export async function generateImageAsync(
  options: { projectRoot: string; cacheType?: string },
  imageOptions: ImageOptions
): Promise<{ source: Buffer; name: string }> {
  const icon = await ensureImageOptionsAsync(imageOptions);

  if (!options.cacheType) {
    await maybeWarnAboutInstallingSharpAsync();
    return { name: icon.name!, source: await resizeAsync(icon) };
  }

  const cacheKey = await Cache.createCacheKeyWithDirectoryAsync(
    options.projectRoot,
    options.cacheType,
    icon
  );

  const name = icon.name!;
  let source: Buffer | null = await Cache.getImageFromCacheAsync(name, cacheKey);

  if (!source) {
    await maybeWarnAboutInstallingSharpAsync();
    source = await resizeAsync(icon);
    await Cache.cacheImageAsync(name, source, cacheKey);
  }

  return { name, source };
}

export async function generateFaviconAsync(
  pngImageBuffer: Buffer,
  sizes: number[] = [16, 32, 48]
): Promise<Buffer> {
  const buffers = await resizeImagesAsync(pngImageBuffer, sizes);
  return await Ico.generateAsync(buffers);
}

/**
 * Layers the provided foreground image over the provided background image.
 *
 * @param foregroundImageBuffer
 * @param foregroundImageBuffer
 * @param x pixel offset from the left edge, defaults to 0.
 * @param y pixel offset from the top edge, defaults to 0.
 */
export async function compositeImagesAsync({
  foreground,
  background,
  x = 0,
  y = 0,
}: {
  foreground: Buffer;
  background: Buffer;
  x?: number;
  y?: number;
}): Promise<Buffer> {
  const sharp: any = await getSharpAsync();
  if (!sharp) {
    const image = (await Jimp.getJimpImageAsync(background)).composite(
      await Jimp.getJimpImageAsync(foreground),
      x,
      y
    );
    return await image.getBufferAsync(image.getMIME());
  }
  return await sharp(background)
    .composite([{ input: foreground, left: x, top: y }])
    .toBuffer();
}

type PNGInfo = {
  data: Buffer;
  width: number;
  height: number;
  bpp: number;
};

export async function getPngInfo(src: string): Promise<PNGInfo> {
  return await parsePng(fs.readFileSync(src));
}
