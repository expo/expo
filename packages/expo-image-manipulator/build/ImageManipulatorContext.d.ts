import { SharedObject } from 'expo';
import type { ActionCrop, ActionExtent } from './ImageManipulator.types';
import type { ImageRef } from './ImageRef';
/**
 * A context for an image manipulation. It provides synchronous, chainable functions that schedule transformations on the original image to the background thread.
 * Use an asynchronous [`renderAsync`](#contextrenderasync) to await for all transformations to finish and access the final image.
 */
export declare class ImageManipulatorContext extends SharedObject {
    /**
     * Resizes the image to the given size.
     * @param size Values correspond to the result image dimensions. If you specify only one value, the other will
     * be calculated automatically to preserve image ratio.
     */
    resize(size: {
        width?: number | null;
        height?: number | null;
    }): ImageManipulatorContext;
    /**
     * Rotates the image by the given number of degrees.
     * @param degrees Degrees to rotate the image. Rotation is clockwise when the value is positive and
     * counter-clockwise when negative.
     */
    rotate(degrees: number): ImageManipulatorContext;
    /**
     * Flips the image vertically or horizontally.
     * @param flipType An axis on which image will be flipped. Only one flip per transformation is available. If you
     * want to flip according to both axes then provide two separate transformations.
     */
    flip(flipType: 'vertical' | 'horizontal'): ImageManipulatorContext;
    /**
     * Crops the image to the given rectangle's origin and size.
     * @param rect Fields specify top-left corner and dimensions of a crop rectangle.
     */
    crop(rect: ActionCrop['crop']): ImageManipulatorContext;
    /**
     * Set the image size and offset. If the image is enlarged, unfilled areas are set to the `backgroundColor`.
     * To position the image, use `originX` and `originY`.
     *
     * @platform web
     */
    extent(options: ActionExtent['extent']): ImageManipulatorContext;
    /**
     * Resets the manipulator context to the originally loaded image.
     */
    reset(): ImageManipulatorContext;
    /**
     * Awaits for all manipulation tasks to finish and resolves with a reference to the resulted native image.
     */
    renderAsync(): Promise<ImageRef>;
}
declare const _default: typeof ImageManipulatorContext;
export default _default;
//# sourceMappingURL=ImageManipulatorContext.d.ts.map