/// <reference types="node" />
import * as Cache from './Cache';
import { compositeImagesAsync, generateFaviconAsync, generateImageAsync, getPngInfo } from './Image';
import { ImageFormat, ImageOptions, ResizeMode } from './Image.types';
import { jimpAsync } from './jimp';
import { findSharpInstanceAsync, isAvailableAsync, sharpAsync } from './sharp';
import { SharpCommandOptions, SharpGlobalOptions } from './sharp.types';
export declare function imageAsync(options: SharpGlobalOptions, commands?: SharpCommandOptions[]): Promise<Buffer | string[]>;
export { jimpAsync, findSharpInstanceAsync, isAvailableAsync, sharpAsync, generateImageAsync, generateFaviconAsync, Cache, compositeImagesAsync, getPngInfo, };
export { SharpGlobalOptions, SharpCommandOptions, ResizeMode, ImageFormat, ImageOptions };
