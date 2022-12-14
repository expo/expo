import React from 'react';
import { ImageTransitionEffect, ImageTransitionTiming, } from './Image.types';
import { resolveContentFit, resolveContentPosition } from './utils';
function resolveAssetSource(source) {
    if (source == null)
        return null;
    if (typeof source === 'string') {
        return { uri: source };
    }
    if (typeof source === 'number') {
        return { uri: String(source) };
    }
    return source;
}
function ensureUnit(value) {
    const trimmedValue = String(value).trim();
    if (trimmedValue.endsWith('%')) {
        return trimmedValue;
    }
    return `${trimmedValue}px`;
}
function getObjectPositionFromContentPosition(contentPosition) {
    const resolvedPosition = (typeof contentPosition === 'string' ? resolveContentPosition(contentPosition) : contentPosition);
    if (!resolvedPosition) {
        return null;
    }
    if (resolvedPosition.top == null || resolvedPosition.bottom == null) {
        resolvedPosition.top = '50%';
    }
    if (resolvedPosition.left == null || resolvedPosition.right == null) {
        resolvedPosition.left = '50%';
    }
    return ['top', 'bottom', 'left', 'right']
        .map((key) => {
        if (key in resolvedPosition) {
            return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
    })
        .join(' ');
}
function ensureIsArray(source) {
    if (Array.isArray(source)) {
        return source;
    }
    if (source == null) {
        return [];
    }
    return [source];
}
function useImageState(source) {
    const [imageState, setImageState] = React.useState(source ? 'loading' : 'empty');
    React.useEffect(() => {
        setImageState((prevState) => prevState === 'empty' ? (source ? 'loading' : 'empty') : prevState);
    }, [source]);
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
export default function ExpoImage({ source, placeholder, loadingIndicatorSource, contentPosition, onLoad, transition, onLoadStart, onLoadEnd, onError, ...props }) {
    const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
    const [state, handlers] = useImageState(source);
    const { placeholder: placeholderStyle, image: imageStyle } = useTransition(transition, state);
    const resolvedSources = ensureIsArray(source).map(resolveAssetSource);
    return (React.createElement("div", { style: {
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            ...style,
            overflow: 'hidden',
            position: 'relative',
        } },
        React.createElement("img", { src: ensureIsArray(placeholder).map(resolveAssetSource)?.[0]?.uri, style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
                objectFit: 'scale-down',
                objectPosition: 'center',
                ...placeholderStyle,
            } }),
        React.createElement("img", { src: resolvedSources.at(0)?.uri, style: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
                objectFit: resolveContentFit(props.contentFit, props.resizeMode),
                objectPosition: getObjectPositionFromContentPosition(contentPosition) || '50% 50%',
                ...imageStyle,
            }, onLoad: handlers.onLoad })));
}
//# sourceMappingURL=ExpoImage.web.js.map