import React, { useEffect, useMemo } from 'react';
import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';
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
const ImageWrapper = React.forwardRef(({ source, events, contentPosition, hashPlaceholderContentPosition, priority, style, hashPlaceholderStyle, tintColor, className, accessibilityLabel, ...props }, ref) => {
    useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    const isBlurhash = isBlurhashString(source?.uri || '');
    const isThumbhash = isThumbhashString(source?.uri || '');
    const isHash = isBlurhash || isThumbhash;
    // Thumbhash uri always has to start with 'thumbhash:/'
    const thumbhash = source?.uri?.replace(/thumbhash:\//, '');
    const thumbhashUri = useMemo(() => (isThumbhash ? thumbHashStringToDataURL(thumbhash ?? '') : null), [thumbhash]);
    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    if (!source) {
        return null;
    }
    const objectPosition = getObjectPositionFromContentPositionObject(isHash ? hashPlaceholderContentPosition : contentPosition);
    const uri = isHash ? blurhashUri ?? thumbhashUri : source?.uri;
    return (React.createElement(React.Fragment, null,
        React.createElement(ColorTintFilter, { tintColor: tintColor }),
        React.createElement("img", { ref: ref, alt: accessibilityLabel, className: className, src: uri || undefined, key: source?.uri, style: {
                objectPosition,
                ...absoluteFilledPosition,
                ...getTintColorStyle(tintColor),
                ...(isHash ? hashPlaceholderStyle : {}),
                ...style,
            }, 
            // @ts-ignore
            // eslint-disable-next-line react/no-unknown-property
            fetchpriority: getFetchPriorityFromImagePriority(priority || 'normal'), ...getImageWrapperEventHandler(events, source), ...getImgPropsFromSource(source), ...props })));
});
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.js.map