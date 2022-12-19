import React from 'react';
import { ImageTransitionEffect, ImageTransitionTiming, ImagePriority, ImageCacheType, } from './Image.types';
function ensureUnit(value) {
    const trimmedValue = String(value).trim();
    if (trimmedValue.endsWith('%')) {
        return trimmedValue;
    }
    return `${trimmedValue}px`;
}
function getObjectPositionFromContentPositionObject(contentPosition) {
    const resolvedPosition = { ...contentPosition };
    if (!resolvedPosition) {
        return '50% 50%';
    }
    if (resolvedPosition.top == null && resolvedPosition.bottom == null) {
        resolvedPosition.top = '50%';
    }
    if (resolvedPosition.left == null && resolvedPosition.right == null) {
        resolvedPosition.left = '50%';
    }
    return (['top', 'bottom', 'left', 'right']
        .map((key) => {
        if (key in resolvedPosition) {
            return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
    })
        .join(' ') || '50% 50%');
}
function useImageState(source) {
    const hasAnySource = source && source.length > 0;
    const [imageState, setImageState] = React.useState(hasAnySource ? 'loading' : 'empty');
    React.useEffect(() => {
        setImageState((prevState) => prevState === 'empty' ? (hasAnySource ? 'loading' : 'empty') : prevState);
    }, [hasAnySource]);
    const onLoad = React.useCallback(() => setImageState((prevState) => (imageState === 'loading' ? 'loaded' : prevState)), []);
    const handlers = React.useMemo(() => ({
        onLoad,
    }), [onLoad]);
    return [imageState, handlers];
}
function getCSSTiming(timing) {
    return ({
        [ImageTransitionTiming.EASE_IN]: 'ease-in',
        [ImageTransitionTiming.EASE_OUT]: 'ease-out',
        [ImageTransitionTiming.EASE_IN_OUT]: 'ease-in-out',
        [ImageTransitionTiming.LINEAR]: 'linear',
    }[timing || ImageTransitionTiming.LINEAR] ?? 'linear');
}
function getTransitionObjectFromTransition(transition) {
    if (transition == null) {
        return {
            timing: ImageTransitionTiming.LINEAR,
            duration: 0,
            effect: ImageTransitionEffect.NONE,
        };
    }
    if (typeof transition === 'number') {
        return {
            timing: ImageTransitionTiming.EASE_IN_OUT,
            duration: transition,
            effect: ImageTransitionEffect.CROSS_DISOLVE,
        };
    }
    return {
        timing: ImageTransitionTiming.EASE_IN_OUT,
        duration: 1000,
        ...transition,
    };
}
const useTransition = (transition, state) => {
    const { duration, timing, effect } = getTransitionObjectFromTransition(transition);
    if (effect === ImageTransitionEffect.CROSS_DISOLVE) {
        const commonStyles = {
            transition: `opacity ${duration}ms`,
            transitionTimingFunction: getCSSTiming(timing),
        };
        return {
            image: {
                opacity: state === 'loaded' ? '1' : '0',
                ...commonStyles,
            },
            placeholder: {
                opacity: state === 'loaded' ? '0' : '1',
                ...commonStyles,
            },
        };
    }
    if (effect === ImageTransitionEffect.FLIP_FROM_TOP) {
        const commonStyles = {
            transition: `transform ${duration}ms`,
            transformOrigin: 'top',
            transitionTimingFunction: getCSSTiming(timing),
        };
        return {
            placeholder: {
                transform: `rotateX(${state !== 'loaded' ? '0' : '90deg'})`,
                ...commonStyles,
            },
            image: {
                transform: `rotateX(${state === 'loaded' ? '0' : '90deg'})`,
                ...commonStyles,
            },
        };
    }
    return { placeholder: {}, image: {} };
};
function getFetchPriorityFromImagePriority(priority) {
    switch (priority) {
        case ImagePriority.HIGH:
            return 'high';
        case ImagePriority.LOW:
            return 'low';
        case ImagePriority.NORMAL:
        default:
            return 'auto';
    }
}
export default function ExpoImage({ source, placeholder, contentFit, contentPosition, onLoad, transition, onError, onLoadEnd, priority, ...props }) {
    const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
    const [state, handlers] = useImageState(source);
    const { placeholder: placeholderStyle, image: imageStyle } = useTransition(transition, state);
    function onLoadHandler(event) {
        handlers.onLoad();
        const target = event.target;
        onLoad?.({
            source: {
                url: target.currentSrc,
                width: target.naturalWidth,
                height: target.naturalHeight,
                mediaType: null,
            },
            cacheType: ImageCacheType.NONE,
        });
        onLoadEnd?.();
    }
    function onErrorHandler() {
        onError?.({
            error: `Failed to load image from url: ${source?.[0]?.uri}`,
        });
        onLoadEnd?.();
    }
    return (React.createElement("div", { style: {
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            ...style,
            overflow: 'hidden',
            position: 'relative',
        } },
        React.createElement("img", { src: placeholder?.[0]?.uri, 
            // @ts-ignore
            // eslint-disable-next-line react/no-unknown-property
            fetchpriority: getFetchPriorityFromImagePriority(priority), style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
                objectFit: 'scale-down',
                objectPosition: 'center',
                ...placeholderStyle,
            } }),
        React.createElement("img", { src: source?.[0]?.uri, style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
                objectFit: contentFit,
                objectPosition: getObjectPositionFromContentPositionObject(contentPosition),
                ...imageStyle,
            }, onLoad: onLoadHandler, onError: onErrorHandler })));
}
//# sourceMappingURL=ExpoImage.web.js.map