import * as Cache from './Cache';
import { compositeImagesAsync, generateFaviconAsync, generateImageAsync, generateImageBackgroundAsync, getPngInfo } from './Image';
import { ImageFormat, ImageOptions, ResizeMode } from './Image.types';
import { jimpAsync, createSquareAsync } from './jimp';
import { findSharpInstanceAsync, isAvailableAsync, sharpAsync } from './sharp';
import { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';
export declare function imageAsync(options: SharpGlobalOptions, commands?: SharpCommandOptions[]): Promise<Buffer<ArrayBufferLike> | string[]>;
export { jimpAsync, createSquareAsync, findSharpInstanceAsync, isAvailableAsync, sharpAsync, generateImageAsync, generateImageBackgroundAsync, generateFaviconAsync, Cache, compositeImagesAsync, getPngInfo, };
export { SharpGlobalOptions, SharpCommandOptions, ResizeMode, ImageFormat, ImageOptions };
