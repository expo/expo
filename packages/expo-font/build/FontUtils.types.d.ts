export interface RenderToImageOptions {
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
export interface RenderToImageResult {
    /**
     * The file uri to the image.
     */
    uri: string;
    /**
     * Image width in dp.
     */
    width: number;
    /**
     * Image height in dp.
     */
    height: number;
    /**
     * Scale factor of the image. Multiply the dp dimensions by this value to get the dimensions in pixels.
     * */
    scale: number;
}
//# sourceMappingURL=FontUtils.types.d.ts.map