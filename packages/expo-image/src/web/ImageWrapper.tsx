import React, { useEffect, Ref } from 'react';

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
        <ColorTintFilter tintColor={tintColor} />
        <img
          ref={ref}
          alt={accessibilityLabel}
          className={className}
          src={sourceWithHeaders?.uri || undefined}
          key={source?.uri}
          style={{
            objectPosition,
            ...absoluteFilledPosition,
            ...getTintColorStyle(tintColor),
            ...style,
            ...(isImageHash ? hashPlaceholderStyle : {}),
          }}
          // @ts-ignore
          // eslint-disable-next-line react/no-unknown-property
          fetchpriority={getFetchPriorityFromImagePriority(priority || 'normal')}
          {...getImageWrapperEventHandler(events, sourceWithHeaders)}
          {...getImgPropsFromSource(source)}
          {...props}
        />
      </>
    );
  }
);

export default ImageWrapper;
