import { ImageContentFit, ImageContentPosition, ImageContentPositionObject, ImageResizeMode } from './Image.types';
/**
 * If the `contentFit` is not provided, it's resolved from the the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 */
export declare function resolveContentFit(contentFit?: ImageContentFit, resizeMode?: ImageResizeMode): ImageContentFit;
/**
 * It resolves a stringified form of the `contentPosition` prop to an object,
 * which is the only form supported in the native code.
 */
export declare function resolveContentPosition(contentPosition?: ImageContentPosition): ImageContentPositionObject | undefined;
//# sourceMappingURL=utils.d.ts.map