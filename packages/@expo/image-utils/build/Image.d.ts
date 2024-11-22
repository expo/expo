/// <reference types="node" />
import { ImageOptions } from './Image.types';
export declare function getMimeType(srcPath: string): string | null;
export declare function generateImageBackgroundAsync(imageOptions: Omit<ImageOptions, 'src'>): Promise<Buffer>;
export declare function generateImageAsync(options: {
    projectRoot: string;
    cacheType?: string;
}, imageOptions: ImageOptions): Promise<{
    source: Buffer;
    name: string;
}>;
export declare function generateFaviconAsync(pngImageBuffer: Buffer, sizes?: number[]): Promise<Buffer>;
/**
 * Layers the provided foreground image over the provided background image.
 *
 * @param foregroundImageBuffer
 * @param foregroundImageBuffer
 * @param x pixel offset from the left edge, defaults to 0.
 * @param y pixel offset from the top edge, defaults to 0.
 */
export declare function compositeImagesAsync({ foreground, background, x, y, }: {
    foreground: Buffer;
    background: Buffer;
    x?: number;
    y?: number;
}): Promise<Buffer>;
type PNGInfo = {
    data: Buffer;
    width: number;
    height: number;
    bpp: number;
};
export declare function getPngInfo(src: string): Promise<PNGInfo>;
export {};
