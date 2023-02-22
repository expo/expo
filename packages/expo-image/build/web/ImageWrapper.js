import React, { useEffect } from 'react';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isBlurhashString } from '../utils/resolveSources';
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
function getFetchPriorityFromImagePriority(priority = 'normal') {
    return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}
const ImageWrapper = React.forwardRef(({ source, events, contentPosition, blurhashContentPosition, priority, style, blurhashStyle, className, }, ref) => {
    useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    const isBlurhash = isBlurhashString(source?.uri || '');
    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    const objectPosition = getObjectPositionFromContentPositionObject(isBlurhash ? blurhashContentPosition : contentPosition);
    const uri = isBlurhash ? blurhashUri : source?.uri;
    if (!uri)
        return null;
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
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.js.map