import React, { useEffect, Ref, useMemo } from 'react';

import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import { ImageWrapperProps } from './ImageWrapper.types';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
import { SrcSetSource } from './useSourceSelection';
import { ImageNativeProps, ImageSource } from '../Image.types';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';
import { thumbHashStringToDataURL } from '../utils/thumbhash/thumbhash';

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
      ...props
    }: ImageWrapperProps,
    ref: Ref<HTMLImageElement>
  ) => {
    useEffect(() => {
      events?.onMount?.forEach((e) => e?.());
    }, []);

    const isBlurhash = isBlurhashString(source?.uri || '');
    const isThumbhash = isThumbhashString(source?.uri || '');
    const isHash = isBlurhash || isThumbhash;

    // Thumbhash uri always has to start with 'thumbhash:/'
    const thumbhash = source?.uri?.replace(/thumbhash:\//, '');
    const thumbhashUri = useMemo(
      () => (isThumbhash ? thumbHashStringToDataURL(thumbhash ?? '') : null),
      [thumbhash]
    );

    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    if (!source) {
      return null;
    }

    const objectPosition = getObjectPositionFromContentPositionObject(
      isHash ? hashPlaceholderContentPosition : contentPosition
    );

    const uri = isHash ? blurhashUri ?? thumbhashUri : source?.uri;

    return (
      <>
        <ColorTintFilter tintColor={tintColor} />
        <img
          ref={ref}
          alt={accessibilityLabel}
          className={className}
          src={uri || undefined}
          key={source?.uri}
          style={{
            objectPosition,
            ...absoluteFilledPosition,
            ...getTintColorStyle(tintColor),
            ...(isHash ? hashPlaceholderStyle : {}),
            ...style,
          }}
          // @ts-ignore
          // eslint-disable-next-line react/no-unknown-property
          fetchpriority={getFetchPriorityFromImagePriority(priority || 'normal')}
          {...getImageWrapperEventHandler(events, source)}
          {...getImgPropsFromSource(source)}
          {...props}
        />
      </>
    );
  }
);

export default ImageWrapper;
