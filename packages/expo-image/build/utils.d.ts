import { ImageContentFit, ImageContentPosition, ImageContentPositionObject, ImageProps, ImageTransition } from './Image.types';
/**
 * If the `contentFit` is not provided, it's resolved from the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 */
export declare function resolveContentFit(contentFit?: ImageContentFit, resizeMode?: ImageProps['resizeMode']): ImageContentFit;
/**
 * It resolves a stringified form of the `contentPosition` prop to an object,
 * which is the only form supported in the native code.
 */
export declare function resolveContentPosition(contentPosition?: ImageContentPosition): ImageContentPositionObject;
/**
 * If `transition` or `fadeDuration` is a number, it's resolved to a cross dissolve transition with the given duration.
 * When `fadeDuration` is used, it logs an appropriate deprecation warning.
 */
export declare function resolveTransition(transition?: ImageProps['transition'], fadeDuration?: ImageProps['fadeDuration']): ImageTransition | null;
//# sourceMappingURL=utils.d.ts.map