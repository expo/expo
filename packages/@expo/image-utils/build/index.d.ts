import * as Cache from './Cache';
import { compositeImagesAsync, generateFaviconAsync, generateImageAsync, generateImageBackgroundAsync, getPngInfo } from './Image';
import { jimpAsync, createSquareAsync } from './jimp';
import { findSharpInstanceAsync, isAvailableAsync, sharpAsync } from './sharp';
import { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';
export declare function imageAsync(options: SharpGlobalOptions, commands?: SharpCommandOptions[]): Promise<string[] | Buffer<ArrayBufferLike>>;
export { jimpAsync, createSquareAsync, findSharpInstanceAsync, isAvailableAsync, sharpAsync, generateImageAsync, generateImageBackgroundAsync, generateFaviconAsync, Cache, compositeImagesAsync, getPngInfo, };
export type { SharpGlobalOptions, SharpCommandOptions } from './sharp.types';
export type { ResizeMode, ImageFormat, ImageOptions } from './Image.types';
