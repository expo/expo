export type ImageResult = {
    /**
     * An URI to the modified image (usable as the source for an `Image` or `Video` element).
     */
    uri: string;
    /**
     * Width of the image or video.
     */
    width: number;
    /**
     * Height of the image or video.
     */
    height: number;
    /**
     * It is included if the `base64` save option was truthy, and is a string containing the
     * JPEG/PNG (depending on `format`) data of the image in Base64. Prepend that with `'data:image/xxx;base64,'`
     * to get a data URI, which you can use as the source for an `Image` element for example
     * (where `xxx` is `jpeg` or `png`).
     */
    base64?: string;
};
export type ActionResize = {
    /**
     * Values correspond to the result image dimensions. If you specify only one value, the other will
     * be calculated automatically to preserve image ratio.
     */
    resize: {
        width?: number;
        height?: number;
    };
};
export type ActionRotate = {
    /**
     * Degrees to rotate the image. Rotation is clockwise when the value is positive and
     * counter-clockwise when negative.
     */
    rotate: number;
};
export declare enum FlipType {
    Vertical = "vertical",
    Horizontal = "horizontal"
}
export type ActionFlip = {
    /**
     * An axis on which image will be flipped. Only one flip per transformation is available. If you
     * want to flip according to both axes then provide two separate transformations.
     */
    flip: FlipType;
};
export type ActionCrop = {
    /**
     * Fields specify top-left corner and dimensions of a crop rectangle.
     */
    crop: {
        originX: number;
        originY: number;
        width: number;
        height: number;
    };
};
export type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop;
export declare enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
    /**
     * @platform web
     */
    WEBP = "webp"
}
/**
 * A map defining how modified image should be saved.
 */
export type SaveOptions = {
    /**
     * Whether to also include the image data in Base64 format.
     */
    base64?: boolean;
    /**
     * A value in range `0.0` - `1.0` specifying compression level of the result image. `1` means
     * no compression (highest quality) and `0` the highest compression (lowest quality).
     */
    compress?: number;
    /**
     * Specifies what type of compression should be used and what is the result file extension.
     * `SaveFormat.PNG` compression is lossless but slower, `SaveFormat.JPEG` is faster but the image
     * has visible artifacts. Defaults to `SaveFormat.JPEG`
     */
    format?: SaveFormat;
};
//# sourceMappingURL=ImageManipulator.types.d.ts.map