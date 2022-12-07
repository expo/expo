import { requireNativeViewManager, requireNativeModule } from 'expo-modules-core';
import React from 'react';
import { Image, StyleSheet, Platform, processColor } from 'react-native';
import { ImageContentFit, ImageResizeMode, } from './Image.types';
const NativeExpoImage = requireNativeViewManager('ExpoImage');
const ExpoImageModule = requireNativeModule('ExpoImage');
function withDeprecatedNativeEvent(event) {
    Object.defineProperty(event.nativeEvent, 'nativeEvent', {
        get() {
            console.warn('[expo-image]: Accessing event payload through "nativeEvent" is deprecated, it is now part of the event object itself');
            return event;
        },
    });
    return event.nativeEvent;
}
let loggedResizeModeDeprecationWarning = false;
let loggedRepeatDeprecationWarning = false;
/**
 * If the `contentFit` is not provided, it's resolved from the the equivalent `resizeMode` prop
 * that we support to provide compatibility with React Native Image.
 */
function resolveContentFit(contentFit, resizeMode) {
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
function resolveContentPosition(contentPosition) {
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
class ExpoImage extends React.PureComponent {
    onLoadStart = () => {
        this.props.onLoadStart?.();
    };
    onLoad = (event) => {
        this.props.onLoad?.(withDeprecatedNativeEvent(event));
        this.onLoadEnd();
    };
    onProgress = (event) => {
        this.props.onProgress?.(withDeprecatedNativeEvent(event));
    };
    onError = (event) => {
        this.props.onError?.(withDeprecatedNativeEvent(event));
        this.onLoadEnd();
    };
    onLoadEnd = () => {
        this.props.onLoadEnd?.();
    };
    render() {
        const { source, style, defaultSource, loadingIndicatorSource, ...props } = this.props;
        const resolvedSource = Image.resolveAssetSource(source ?? {});
        const resolvedStyle = StyleSheet.flatten([style]);
        const resolvedPlaceholder = Image.resolveAssetSource(defaultSource ?? loadingIndicatorSource ?? {});
        const contentFit = resolveContentFit(props.contentFit, props.resizeMode);
        const contentPosition = resolveContentPosition(props.contentPosition);
        // If both are specified, we default to use default source
        if (defaultSource && loadingIndicatorSource) {
            console.warn("<Image> component can't have both defaultSource and loadingIndicatorSource at the same time. Defaulting to defaultSource");
        }
        // When possible, pass through the intrinsic size of the asset to the Yoga layout
        // system. While this is also possible in native code, doing it here is more efficient
        // as the yoga node gets initialized with the correct size from the start.
        // In native code, there is a separation between the layout (shadow) nodes and
        // actual views. Views that update the intrinsic content-size in Yoga trigger
        // additional layout passes, which we want to prevent.
        if (!Array.isArray(resolvedSource)) {
            const { width, height } = resolvedSource;
            resolvedStyle.width = resolvedStyle.width ?? width;
            resolvedStyle.height = resolvedStyle.height ?? height;
        }
        // Shadows behave different on iOS, Android & Web.
        // Android uses the `elevation` prop, whereas iOS
        // and web use the regular `shadow...` props.
        let hasShadows = false;
        if (Platform.OS === 'android') {
            delete resolvedStyle.shadowColor;
            delete resolvedStyle.shadowOffset;
            delete resolvedStyle.shadowOpacity;
            delete resolvedStyle.shadowRadius;
            hasShadows = !!resolvedStyle.elevation;
        }
        else {
            delete resolvedStyle.elevation;
            hasShadows = !!resolvedStyle.shadowColor;
        }
        // @ts-ignore
        const backgroundColor = processColor(resolvedStyle.backgroundColor);
        // On Android, we have to set the `backgroundColor` directly on the correct component.
        // So we have to remove it from styles. Otherwise, the background color won't take into consideration the border-radius.
        if (Platform.OS === 'android') {
            delete resolvedStyle.backgroundColor;
        }
        // Shadows are rendered quite differently on iOS, Android and web.
        // - iOS renders the shadow along the transparent contours of the image.
        // - Android renders an underlay which extends to the inside of the bounds.
        // - Web renders the shadow only on the outside of the bounds.
        // To achieve a consistent appearance on all platforms, it is highly recommended
        // to set a background-color on the Image when using shadows. This will ensure
        // consistent rendering on all platforms and mitigate Androids drawing artefacts.
        if (hasShadows) {
            const bkColor = typeof backgroundColor === 'number' ? backgroundColor : 0;
            const alpha = bkColor >> 24;
            if (alpha !== -1 && alpha !== 255) {
                // To silence this warning, set background-color to a fully transparent color
                console.warn(`"expo-image" Shadows may not be rendered correctly for the transparent parts of images. Set "backgroundColor" to a non-transparent color when using a shadow.`);
            }
        }
        const tintColor = processColor(resolvedStyle.tintColor);
        const borderColor = processColor(resolvedStyle.borderColor);
        // @ts-ignore
        const borderStartColor = processColor(resolvedStyle.borderStartColor);
        // @ts-ignore
        const borderEndColor = processColor(resolvedStyle.borderEndColor);
        // @ts-ignore
        const borderLeftColor = processColor(resolvedStyle.borderLeftColor);
        // @ts-ignore
        const borderRightColor = processColor(resolvedStyle.borderRightColor);
        // @ts-ignore
        const borderTopColor = processColor(resolvedStyle.borderTopColor);
        // @ts-ignore
        const borderBottomColor = processColor(resolvedStyle.borderBottomColor);
        return (React.createElement(NativeExpoImage, { ...props, ...resolvedStyle, source: Array.isArray(resolvedSource) ? resolvedSource : [resolvedSource], style: resolvedStyle, defaultSource: resolvedPlaceholder, contentFit: contentFit, contentPosition: contentPosition, onLoadStart: this.onLoadStart, onLoad: this.onLoad, onProgress: this.onProgress, onError: this.onError, 
            // @ts-ignore
            tintColor: tintColor, borderColor: borderColor, borderLeftColor: borderLeftColor, borderRightColor: borderRightColor, borderTopColor: borderTopColor, borderBottomColor: borderBottomColor, borderStartColor: borderStartColor, borderEndColor: borderEndColor, backgroundColor: backgroundColor }));
    }
}
export { ExpoImageModule };
export default ExpoImage;
//# sourceMappingURL=ExpoImage.js.map