import * as Cache from './Cache';
import {
  compositeImagesAsync,
  generateFaviconAsync,
  generateImageAsync,
  generateImageBackgroundAsync,
  getPngInfo,
} from './Image';
import { convertFormat, jimpAsync, createSquareAsync } from './jimp';
import { findSharpInstanceAsync, isAvailableAsync, sharpAsync } from './sharp';
import { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';

export async function imageAsync(
  options: SharpGlobalOptions,
  commands: SharpCommandOptions[] = []
) {
  if (await isAvailableAsync()) {
    return sharpAsync(options, commands);
  }
  return jimpAsync(
    { ...options, format: convertFormat(options.format), originalInput: options.input },
    commands
  );
}

export {
  jimpAsync,
  createSquareAsync,
  findSharpInstanceAsync,
  isAvailableAsync,
  sharpAsync,
  generateImageAsync,
  generateImageBackgroundAsync,
  generateFaviconAsync,
  Cache,
  compositeImagesAsync,
  getPngInfo,
};

export type { SharpGlobalOptions, SharpCommandOptions } from './sharp.types';

export type { ResizeMode, ImageFormat, ImageOptions } from './Image.types';
