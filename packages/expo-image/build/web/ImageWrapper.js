import React, { useEffect } from 'react';
import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { useHeaders, useImageHashes } from './hooks';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
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
const ImageWrapper = React.forwardRef(({ source, events, contentPosition, hashPlaceholderContentPosition, priority, style, hashPlaceholderStyle, tintColor, className, accessibilityLabel, cachePolicy, ...props }, ref) => {
    useEffect(() => {
        events?.onMount?.forEach((e) => e?.());
    }, []);
    // Thumbhash uri always has to start with 'thumbhash:/'
    const { resolvedSource, isImageHash } = useImageHashes(source);
    const objectPosition = getObjectPositionFromContentPositionObject(isImageHash ? hashPlaceholderContentPosition : contentPosition);
    const sourceWithHeaders = useHeaders(resolvedSource, cachePolicy, events?.onError);
    if (!sourceWithHeaders) {
        return null;
    }
    return (<>
        <ColorTintFilter tintColor={tintColor}/>
        <img ref={ref} alt={accessibilityLabel} className={className} src={sourceWithHeaders?.uri || undefined} key={source?.uri} style={{
            objectPosition,
            ...absoluteFilledPosition,
            ...getTintColorStyle(tintColor),
            ...style,
            ...(isImageHash ? hashPlaceholderStyle : {}),
        }} 
    // @ts-ignore
    // eslint-disable-next-line react/no-unknown-property
    fetchpriority={getFetchPriorityFromImagePriority(priority || 'normal')} {...getImageWrapperEventHandler(events, sourceWithHeaders)} {...getImgPropsFromSource(source)} {...props}/>
      </>);
});
export default ImageWrapper;
//# sourceMappingURL=ImageWrapper.js.map