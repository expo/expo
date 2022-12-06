import { ImageContentFit, ImageResizeMode, } from './Image.types';
let loggedResizeModeDeprecationWarning = false;
let loggedRepeatDeprecationWarning = false;
/**
 * If the `contentFit` is not provided, it's resolved from the the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 */
export function resolveContentFit(contentFit, resizeMode) {
    if (contentFit) {
        return contentFit;
    }
    if (resizeMode) {
        if (!loggedResizeModeDeprecationWarning) {
            console.log('[expo-image]: Prop "resizeMode" is deprecated, use "contentFit" instead');
            loggedResizeModeDeprecationWarning = true;
        }
        switch (resizeMode) {
            case ImageResizeMode.CONTAIN:
                return ImageContentFit.CONTAIN;
            case ImageResizeMode.COVER:
                return ImageContentFit.COVER;
            case ImageResizeMode.STRETCH:
                return ImageContentFit.FILL;
            case ImageResizeMode.CENTER:
                return ImageContentFit.SCALE_DOWN;
            case ImageResizeMode.REPEAT:
                if (!loggedRepeatDeprecationWarning) {
                    console.log('[expo-image]: Resize mode "repeat" is no longer supported');
                    loggedRepeatDeprecationWarning = true;
                }
        }
    }
    return ImageContentFit.CONTAIN;
}
/**
 * It resolves a stringified form of the `contentPosition` prop to an object,
 * which is the only form supported in the native code.
 */
export function resolveContentPosition(contentPosition) {
    if (typeof contentPosition === 'string') {
        const contentPositionStringMappings = {
            center: { top: '50%', left: '50%' },
            top: { top: 0, left: '50%' },
            right: { top: '50%', right: 0 },
            bottom: { bottom: 0, left: '50%' },
            left: { top: '50%', left: 0 },
            'top center': { top: 0, left: '50%' },
            'top right': { top: 0, right: 0 },
            'top left': { top: 0, left: 0 },
            'right center': { top: '50%', right: 0 },
            'right top': { top: 0, right: 0 },
            'right bottom': { bottom: 0, right: 0 },
            'bottom center': { bottom: 0, left: '50%' },
            'bottom right': { bottom: 0, right: 0 },
            'bottom left': { bottom: 0, left: 0 },
            'left center': { top: '50%', left: 0 },
            'left top': { top: 0, left: 0 },
            'left bottom': { bottom: 0, left: 0 },
        };
        const contentPositionObject = contentPositionStringMappings[contentPosition];
        if (!contentPositionObject) {
            console.warn(`[expo-image]: Content position "${contentPosition}" is invalid`);
            return contentPositionStringMappings.center;
        }
        return contentPositionObject;
    }
    return contentPosition;
}
//# sourceMappingURL=utils.js.map