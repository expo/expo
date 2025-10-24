import type { RenderToImageOptions, RenderToImageResult } from './FontUtils.types';
export type { RenderToImageOptions, RenderToImageResult };
/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with image metadata.
 * @platform android
 * @platform ios
 */
export declare function renderToImageAsync(glyphs: string, options?: RenderToImageOptions): Promise<RenderToImageResult>;
//# sourceMappingURL=FontUtils.d.ts.map