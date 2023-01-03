import React from 'react';
import AnimationManager, { getAnimatorFromClass } from './web/AnimationManager';
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
const SUPPORTED_ANIMATIONS = [
    'cross-dissolve',
    'flip-from-left',
    'flip-from-right',
    'flip-from-top',
    'flip-from-bottom',
];
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, onLoad, transition, onError, responsivePolicy, onLoadEnd, priority, ...props }) {
    const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
    const { containerRef, source: selectedSource } = useSourceSelection(source, responsivePolicy);
    const animator = getAnimatorFromClass(transition?.effect && SUPPORTED_ANIMATIONS.includes(transition?.effect)
        ? transition?.effect
        : 'cross-dissolve');
    return (React.createElement("div", { ref: containerRef, style: {
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            ...style,
            overflow: 'hidden',
            position: 'relative',
        } },
        React.createElement(AnimationManager, { animation: (transition?.duration ?? -1) > 0 ? animator : null, initial: placeholder?.[0]?.uri
                ? [
                    placeholder?.[0]?.uri || '',
                    ({ onAnimationFinished, ref }) => (React.createElement(ImageWrapper, { ref: ref, source: placeholder?.[0], style: {
                            objectFit: 'scale-down',
                            transitionDuration: `${transition?.duration || 0}ms`,
                            transitionTimingFunction: transition?.timing,
                        }, events: {
                            onTransitionEnd: [onAnimationFinished],
                        }, contentPosition: { left: '50%', top: '50%' }, blurhashContentPosition: contentPosition, blurhashStyle: {
                            objectFit: contentFit,
                        } })),
                ]
                : null }, [
            selectedSource?.uri || placeholder?.[0]?.uri,
            ({ onAnimationFinished, onReady, ref, onMount }) => (React.createElement(ImageWrapper, { ref: ref, source: selectedSource || placeholder?.[0], events: {
                    onError: [onErrorAdapter(onError), onLoadEnd],
                    onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
                    onMount: [onMount],
                    onTransitionEnd: [onAnimationFinished],
                }, style: {
                    objectFit: selectedSource ? contentFit : 'scale-down',
                    transitionDuration: `${transition?.duration || 0}ms`,
                    transitionTimingFunction: transition?.timing,
                }, priority: priority, contentPosition: selectedSource ? contentPosition : { top: '50%', left: '50%' }, blurhashContentPosition: contentPosition, blurhashStyle: {
                    objectFit: contentFit,
                } })),
        ])));
}
//# sourceMappingURL=ExpoImage.web.js.map