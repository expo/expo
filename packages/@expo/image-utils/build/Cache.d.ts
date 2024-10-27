/// <reference types="node" />
import { ImageOptions } from './Image.types';
export declare function createCacheKey(fileSource: string, properties: string[]): string;
export declare function createCacheKeyWithDirectoryAsync(projectRoot: string, type: string, icon: ImageOptions): Promise<string>;
export declare function ensureCacheDirectory(projectRoot: string, type: string, cacheKey: string): Promise<string>;
export declare function getImageFromCacheAsync(fileName: string, cacheKey: string): Promise<null | Buffer>;
export declare function cacheImageAsync(fileName: string, buffer: Buffer, cacheKey: string): Promise<void>;
export declare function clearUnusedCachesAsync(projectRoot: string, type: string): Promise<void>;
