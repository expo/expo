import React, { useEffect, Ref, useId } from 'react';

import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import { ImageWrapperProps } from './ImageWrapper.types';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { useHeaders, useImageHashes } from './hooks';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
import { SrcSetSource } from './useSourceSelection';
import { ImageNativeProps, ImageSource } from '../Image.types';

function getFetchPriorityFromImagePriority(priority: ImageNativeProps['priority'] = 'normal') {
  return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}

function getImgPropsFromSource(source: ImageSource | SrcSetSource | null | undefined) {
  if (source && 'srcset' in source) {
    return {
      srcSet: source.srcset,
      sizes: source.sizes,
    };
  }
  return {};
}

const ImageWrapper = React.forwardRef(
  (
    {
      source,
      events,
      contentPosition,
      hashPlaceholderContentPosition,
      priority,
      style,
      hashPlaceholderStyle,
      tintColor,
      className,
      accessibilityLabel,
      cachePolicy,
      ...props
    }: ImageWrapperProps,
    ref: Ref<HTMLImageElement>
  ) => {
    useEffect(() => {
      events?.onMount?.forEach((e) => e?.());
    }, []);

    // Use a unique ID for the SVG filter so that multiple <Image> can be used
    // on the same page with different tint colors without conflicts.
    const tintId = useId()
      // Make it safe for use as an SVG ID. SVG IDs are most strict than HTML
      // IDs. They must be compliant with https://www.w3.org/TR/xml/#NT-Name.
      // React 19 changed useId() to include « and ». These must be removed or
      // the SVG filter will not work (e.g. in Safari which enforces the spec).
      .replace(/[«»]/g, '_');

    // Thumbhash uri always has to start with 'thumbhash:/'
    const { resolvedSource, isImageHash } = useImageHashes(source);
    const objectPosition = getObjectPositionFromContentPositionObject(
      isImageHash ? hashPlaceholderContentPosition : contentPosition
    );

    const sourceWithHeaders = useHeaders(resolvedSource, cachePolicy, events?.onError);
    if (!sourceWithHeaders) {
      return null;
    }
    return (
      <>
        <ColorTintFilter id={tintId} tintColor={tintColor} />
        <img
          ref={ref}
          alt={accessibilityLabel}
          className={className}
          src={sourceWithHeaders?.uri || undefined}
          key={source?.uri}
          style={{
            objectPosition,
            ...absoluteFilledPosition,
            ...getTintColorStyle(tintId, tintColor),
            ...style,
            ...(isImageHash ? hashPlaceholderStyle : {}),
          }}
          // @ts-ignore
          // eslint-disable-next-line react/no-unknown-property
          fetchPriority={getFetchPriorityFromImagePriority(priority || 'normal')}
          {...getImageWrapperEventHandler(events, sourceWithHeaders)}
          {...getImgPropsFromSource(source)}
          {...props}
        />
      </>
    );
  }
);

export default ImageWrapper;
