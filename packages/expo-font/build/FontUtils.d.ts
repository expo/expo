import { RenderToImageOptions } from './FontUtils.types';
/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with uri to image.
 * @platform android
 * @platform ios
 */
export declare function renderToImageAsync(glyphs: string, options?: RenderToImageOptions): Promise<string>;
//# sourceMappingURL=FontUtils.d.ts.map