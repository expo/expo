import React from 'react';
import AnimationManager from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/style';
import useSourceSelection from './web/useSourceSelection';
loadStyle();
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
const setCssVariables = (element, size) => {
    element?.style.setProperty('--expo-image-width', `${size.width}px`);
    element?.style.setProperty('--expo-image-height', `${size.height}px`);
};
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, ...props }) {
    const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
    const { containerRef, source: selectedSource } = useSourceSelection(source, responsivePolicy, setCssVariables);
    return (React.createElement("div", { ref: containerRef, className: "expo-image-container", style: {
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            ...style,
            overflow: 'hidden',
            position: 'relative',
        } },
        React.createElement(AnimationManager, { transition: transition, initial: placeholder?.[0]?.uri
                ? [
                    placeholder?.[0]?.uri || '',
                    ({ onAnimationFinished }) => (className, style) => (React.createElement(ImageWrapper, { source: placeholder?.[0], style: {
                            objectFit: 'scale-down',
                            ...style,
                        }, className: className, events: {
                            onTransitionEnd: [onAnimationFinished],
                        }, contentPosition: { left: '50%', top: '50%' }, blurhashContentPosition: contentPosition, blurhashStyle: {
                            objectFit: contentFit,
                        } })),
                ]
                : null },
            selectedSource?.uri || placeholder?.[0]?.uri,
            ({ onAnimationFinished, onReady, onMount, onError: onErrorInner }) => (className, style) => (React.createElement(ImageWrapper, { source: selectedSource || placeholder?.[0], events: {
                    onError: [onErrorAdapter(onError), onLoadEnd, onErrorInner],
                    onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
                    onMount: [onMount],
                    onTransitionEnd: [onAnimationFinished],
                }, style: {
                    objectFit: selectedSource ? contentFit : 'scale-down',
                    ...style,
                }, className: className, priority: priority, contentPosition: selectedSource ? contentPosition : { top: '50%', left: '50%' }, blurhashContentPosition: contentPosition, blurhashStyle: {
                    objectFit: contentFit,
                } })))));
}
//# sourceMappingURL=ExpoImage.web.js.map