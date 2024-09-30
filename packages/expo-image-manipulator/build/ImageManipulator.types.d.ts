import type { NativeModule, SharedObject, SharedRef } from 'expo';
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
export type ActionExtent = {
    /**
     * Set the image size and offset. If the image is enlarged, unfilled areas are set to the `backgroundColor`.
     * To position the image, use `originX` and `originY`.
     *
     * @platform web
     */
    extent: {
        backgroundColor?: string | null;
        originX?: number;
        originY?: number;
        width: number;
        height: number;
    };
};
export type Action = ActionResize | ActionRotate | ActionFlip | ActionCrop | ActionExtent;
export declare enum SaveFormat {
    JPEG = "jpeg",
    PNG = "png",
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
export declare class ImageManipulator extends NativeModule {
    Context: typeof Context;
    Image: typeof ImageRef;
    /**
     * Loads an image from the given URI and creates a new image manipulation context.
     */
    manipulate(uri: string): Context;
    /**
     * @hidden This was removed from the native code on iOS and Web. See `ImageManipulator.ts`
     * for the JS implementation that uses the new API under the hood.
     * @platform android
     */
    manipulateAsync(uri: string, actions: Action[], saveOptions: SaveOptions): any;
}
/**
 * A context for an image manipulation. It provides synchronous, chainable functions that schedule transformations on the original image to the background thread.
 * Use an asynchronous [`renderAsync`](#contextrenderasync) to await for all transformations to finish and access the final image.
 */
export declare class Context extends SharedObject {
    /**
     * Resizes the image to the given size.
     * @param size Values correspond to the result image dimensions. If you specify only one value, the other will
     * be calculated automatically to preserve image ratio.
     */
    resize(size: {
        width?: number | null;
        height?: number | null;
    }): Context;
    /**
     * Rotates the image by the given number of degrees.
     * @param degrees Degrees to rotate the image. Rotation is clockwise when the value is positive and
     * counter-clockwise when negative.
     */
    rotate(degrees: number): Context;
    /**
     * Flips the image vertically or horizontally.
     * @param flipType An axis on which image will be flipped. Only one flip per transformation is available. If you
     * want to flip according to both axes then provide two separate transformations.
     */
    flip(flipType: 'vertical' | 'horizontal'): Context;
    /**
     * Crops the image to the given rectangle's origin and size.
     * @param rect Fields specify top-left corner and dimensions of a crop rectangle.
     */
    crop(rect: ActionCrop['crop']): Context;
    /**
     * Set the image size and offset. If the image is enlarged, unfilled areas are set to the `backgroundColor`.
     * To position the image, use `originX` and `originY`.
     *
     * @platform web
     */
    extent(options: ActionExtent['extent']): Context;
    /**
     * Resets the manipulator context to the originally loaded image.
     */
    reset(): Context;
    /**
     * Awaits for all manipulation tasks to finish and resolves with a reference to the resulted native image.
     */
    renderAsync(): Promise<ImageRef>;
}
/**
 * A reference to a native instance of the image.
 */
export declare class ImageRef extends SharedRef<'image'> {
    /**
     * Width of the image.
     */
    width: number;
    /**
     * Height of the image.
     */
    height: number;
    /**
     * Saves the image to the file system in the cache directory.
     * @param options A map defining how modified image should be saved.
     */
    saveAsync(options?: SaveOptions): Promise<ImageResult>;
}
//# sourceMappingURL=ImageManipulator.types.d.ts.map