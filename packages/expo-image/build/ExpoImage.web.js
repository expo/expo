import React from 'react';
import { View } from 'react-native-web';
import AnimationManager from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/imageStyles';
import useSourceSelection from './web/useSourceSelection';
loadStyle();
export const ExpoImageModule = {
    async prefetch(urls, _) {
        const urlsArray = Array.isArray(urls) ? urls : [urls];
        return new Promise((resolve) => {
            let imagesLoaded = 0;
            urlsArray.forEach((url) => {
                const img = new Image();
                img.src = url;
                img.onload = () => {
                    imagesLoaded++;
                    if (imagesLoaded === urlsArray.length) {
                        resolve(true);
                    }
                };
                img.onerror = () => resolve(false);
            });
        });
    },
    async clearMemoryCache() {
        return false;
    },
    async clearDiskCache() {
        return false;
    },
};
function onLoadAdapter(onLoad) {
    return (event) => {
        const target = event.target;
        onLoad?.({
            source: {
                url: target.currentSrc,
                width: target.naturalWidth,
                height: target.naturalHeight,
                mediaType: null,
            },
            cacheType: 'none',
        });
    };
}
function onErrorAdapter(onError) {
    return ({ source }) => {
        onError?.({
            error: `Failed to load image from url: ${source?.uri}`,
        });
    };
}
// Used for some transitions to mimic native animations
const setCssVariables = (element, size) => {
    element?.style.setProperty('--expo-image-width', `${size.width}px`);
    element?.style.setProperty('--expo-image-height', `${size.height}px`);
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, placeholderContentFit, cachePolicy, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, blurRadius, recyclingKey, style, nativeViewRef, ...props }) {
    const imagePlaceholderContentFit = placeholderContentFit || 'scale-down';
    const imageHashStyle = {
        objectFit: placeholderContentFit || contentFit,
    };
    const { containerRef, source: selectedSource } = useSourceSelection(source, responsivePolicy, setCssVariables);
    const initialNodeAnimationKey = (recyclingKey ? `${recyclingKey}-${placeholder?.[0]?.uri}` : placeholder?.[0]?.uri) ?? '';
    const initialNode = placeholder?.[0]?.uri
        ? [
            initialNodeAnimationKey,
            ({ onAnimationFinished }) => (className, style) => (<ImageWrapper {...props} ref={nativeViewRef} source={placeholder?.[0]} style={{
                    objectFit: imagePlaceholderContentFit,
                    ...(blurRadius ? { filter: `blur(${blurRadius}px)` } : {}),
                    ...style,
                }} className={className} events={{
                    onTransitionEnd: [onAnimationFinished],
                }} contentPosition={{ left: '50%', top: '50%' }} hashPlaceholderContentPosition={contentPosition} hashPlaceholderStyle={imageHashStyle}/>),
        ]
        : null;
    const currentNodeAnimationKey = (recyclingKey
        ? `${recyclingKey}-${selectedSource?.uri ?? placeholder?.[0]?.uri}`
        : selectedSource?.uri ?? placeholder?.[0]?.uri) ?? '';
    const currentNode = [
        currentNodeAnimationKey,
        ({ onAnimationFinished, onReady, onMount, onError: onErrorInner }) => (className, style) => (<ImageWrapper {...props} ref={nativeViewRef} source={selectedSource || placeholder?.[0]} events={{
                onError: [onErrorAdapter(onError), onLoadEnd, onErrorInner],
                onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
                onMount: [onMount],
                onTransitionEnd: [onAnimationFinished],
            }} style={{
                objectFit: selectedSource ? contentFit : imagePlaceholderContentFit,
                ...(blurRadius ? { filter: `blur(${blurRadius}px)` } : {}),
                ...style,
            }} className={className} cachePolicy={cachePolicy} priority={priority} contentPosition={selectedSource ? contentPosition : { top: '50%', left: '50%' }} hashPlaceholderContentPosition={contentPosition} hashPlaceholderStyle={imageHashStyle} accessibilityLabel={props.accessibilityLabel}/>),
    ];
    return (<View ref={containerRef} dataSet={{ expoimage: true }} style={[{ overflow: 'hidden' }, style]}>
      <AnimationManager transition={transition} recyclingKey={recyclingKey} initial={initialNode}>
        {currentNode}
      </AnimationManager>
    </View>);
}
//# sourceMappingURL=ExpoImage.web.js.map