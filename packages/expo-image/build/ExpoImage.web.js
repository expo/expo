import React from 'react';
import { useBlurhash } from './utils/blurhash/useBlurhash';
import { isBlurhashString } from './utils/resolveSources';
import AnimationManager, { getAnimatorFromClass } from './web/AnimationManager';
import loadStyle from './web/style';
loadStyle();
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
function findBestSourceForSize(sources, size) {
    return ([...(sources || [])]
        // look for the smallest image that's still larger then a container
        ?.map((source) => {
        if (!size) {
            return { source, penalty: 0, covers: false };
        }
        const { width, height } = typeof source === 'object' ? source : { width: null, height: null };
        if (width == null || height == null) {
            return { source, penalty: 0, covers: false };
        }
        if (width < size.width || height < size.height) {
            return {
                source,
                penalty: Math.max(size.width - width, size.height - height),
                covers: false,
            };
        }
        return { source, penalty: (width - size.width) * (height - size.height), covers: true };
    })
        .sort((a, b) => a.penalty - b.penalty)
        .sort((a, b) => Number(b.covers) - Number(a.covers))[0]?.source ?? null);
}
function useSourceSelection(sources, sizeCalculation = 'live') {
    const hasMoreThanOneSource = (sources?.length ?? 0) > 1;
    // null - not calculated yet, DOMRect - size available
    const [size, setSize] = React.useState(null);
    const resizeObserver = React.useRef(null);
    React.useEffect(() => {
        return () => {
            resizeObserver.current?.disconnect();
        };
    }, []);
    const containerRef = React.useCallback((element) => {
        if (!hasMoreThanOneSource) {
            return;
        }
        setSize(element?.getBoundingClientRect());
        if (sizeCalculation === 'live') {
            resizeObserver.current?.disconnect();
            if (!element) {
                return;
            }
            resizeObserver.current = new ResizeObserver((entries) => {
                setSize(entries[0].contentRect);
            });
            resizeObserver.current.observe(element);
        }
    }, [hasMoreThanOneSource, sizeCalculation]);
    const bestSourceForSize = size !== undefined ? findBestSourceForSize(sources, size) : null;
    const source = (hasMoreThanOneSource ? bestSourceForSize : sources?.[0]) ?? null;
    return React.useMemo(() => ({
        containerRef,
        source,
    }), [source]);
}
function getFetchPriorityFromImagePriority(priority = 'normal') {
    return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}
const Image = React.forwardRef(({ source, events, contentPosition, blurhashContentPosition, priority, style, blurhashStyle, className, }, ref) => {
    React.useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    const isBlurhash = isBlurhashString(source?.uri || '');
    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    const objectPosition = getObjectPositionFromContentPositionObject(isBlurhash ? blurhashContentPosition : contentPosition);
    const uri = isBlurhash ? blurhashUri : source?.uri;
    return (React.createElement("img", { ref: ref, className: className, src: uri || undefined, key: source?.uri, style: {
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: 0,
            right: 0,
            objectPosition,
            ...style,
            ...(isBlurhash ? blurhashStyle : {}),
        }, 
        // @ts-ignore
        // eslint-disable-next-line react/no-unknown-property
        fetchpriority: getFetchPriorityFromImagePriority(priority || 'normal'), onLoad: (event) => {
            events?.onLoad?.forEach((e) => e?.(event));
        }, onTransitionEnd: () => events?.onTransitionEnd?.forEach((e) => e?.()), onError: () => events?.onError?.forEach((e) => e?.({ source: source || null })) }));
});
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
                    ({ onAnimationFinished, ref }) => (React.createElement(Image, { ref: ref, source: placeholder?.[0], style: {
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
            ({ onAnimationFinished, onReady, ref, onMount }) => (React.createElement(Image, { ref: ref, source: selectedSource || placeholder?.[0], events: {
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