import React, { useEffect, useMemo } from 'react';
import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isThumbhashString } from '../utils/resolveSources';
import { thumbHashStringToDataURL } from '../utils/thumbhash/thumbhash';
function getFetchPriorityFromImagePriority(priority = 'normal') {
    return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}
function getImgPropsFromSource(source) {
    if (source && 'srcset' in source) {
        return {
            srcSet: source.srcset,
            sizes: source.sizes,
        };
    }
    return {};
}
function useThumbhash(source) {
    const isThumbhash = isThumbhashString(source?.uri || '');
    const strippedThumbhashString = source?.uri?.replace(/thumbhash:\//, '') ?? '';
    const thumbhashSource = useMemo(() => (isThumbhash ? { uri: thumbHashStringToDataURL(strippedThumbhashString) } : null), [strippedThumbhashString, isThumbhash]);
    return thumbhashSource;
}
function useImageHashes(source) {
    const thumbhash = useThumbhash(source);
    const blurhash = useBlurhash(source);
    return useMemo(() => ({
        resolvedSource: blurhash ?? thumbhash ?? source,
        isImageHash: !!blurhash || !!thumbhash,
    }), [blurhash, thumbhash]);
}
function useCaching(source) { }
const ImageWrapper = React.forwardRef(({ source, events, contentPosition, hashPlaceholderContentPosition, priority, style, hashPlaceholderStyle, tintColor, className, accessibilityLabel, ...props }, ref) => {
    useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    // Thumbhash uri always has to start with 'thumbhash:/'
    const { resolvedSource, isImageHash } = useImageHashes(source);
    const objectPosition = getObjectPositionFromContentPositionObject(isImageHash ? hashPlaceholderContentPosition : contentPosition);
    useCaching(resolvedSource);
    if (!resolvedSource) {
        return null;
    }
    return (React.createElement(React.Fragment, null,
        React.createElement(ColorTintFilter, { tintColor: tintColor }),
        React.createElement("img", { ref: ref, alt: accessibilityLabel, className: className, src: resolvedSource?.uri || undefined, key: source?.uri, style: {
                objectPosition,
                ...absoluteFilledPosition,
                ...getTintColorStyle(tintColor),
                ...(isImageHash ? hashPlaceholderStyle : {}),
                ...style,
            }, 
            // @ts-ignore
            // eslint-disable-next-line react/no-unknown-property
            fetchpriority: getFetchPriorityFromImagePriority(priority || 'normal'), ...getImageWrapperEventHandler(events, resolvedSource), ...getImgPropsFromSource(source), ...props })));
});
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.js.map