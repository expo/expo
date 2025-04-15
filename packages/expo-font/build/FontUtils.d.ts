interface RenderToImageOptions {
    /**
     * Font family name.
     * @default system default
     */
    fontFamily?: string;
    /**
     * Size of the font.
     * @default 24
     */
    size?: number;
    /**
     * Font color
     * @default 'black'
     */
    color?: string;
}
/**
 * Creates an image with provided text.
 * @param glyphs Text to be exported.
 * @param options RenderToImageOptions.
 * @return Promise which fulfils with uri to image.
 * @platform android
 * @platform ios
 */
export declare function renderToImageAsync(glyphs: string, options?: RenderToImageOptions): Promise<string>;
export {};
//# sourceMappingURL=FontUtils.d.ts.map