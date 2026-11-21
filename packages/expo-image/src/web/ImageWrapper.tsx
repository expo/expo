import type { Ref } from 'react';
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react';

import type { ImageNativeProps, ImageSource } from '../Image.types';
import ColorTintFilter, { getTintColorStyle } from './ColorTintFilter';
import type { ImageWrapperProps } from './ImageWrapper.types';
import { getImageWrapperEventHandler } from './getImageWrapperEventHandler';
import { useHeaders, useImageHashes } from './hooks';
import { absoluteFilledPosition, getObjectPositionFromContentPositionObject } from './positioning';
import type { SrcSetSource } from './useSourceSelection';

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
      loading,
      style,
      hashPlaceholderStyle,
      tintColor,
      className,
      accessibilityLabel,
      cachePolicy,
      draggable,
      ...props
    }: ImageWrapperProps,
    ref: Ref<HTMLImageElement>
  ) => {
    useEffect(() => {
      events?.onMount?.forEach((e) => e?.());
    }, []);

    const imgRef = useRef<HTMLImageElement | null>(null);
    const setRef = useCallback(
      (img: HTMLImageElement | null) => {
        imgRef.current = img;
        if (typeof ref === 'function') {
          ref(img);
        } else if (ref) {
          (ref as React.RefObject<HTMLImageElement | null>).current = img;
        }
      },
      [ref]
    );

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
    const handlers = sourceWithHeaders && getImageWrapperEventHandler(events, sourceWithHeaders);
    const loaded = useRef(false);
    const onLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (!loaded.current) {
        loaded.current = true;
        handlers?.onLoad(event);
      }
    };

    // An image the browser already has in memory is complete once mounted: its load is a memory
    // cache hit, reported before the image is painted (`skipOnCacheHit`). Its `load` event that
    // follows is then ignored.
    useLayoutEffect(() => {
      const img = imgRef.current;
      if (img?.complete && img.naturalWidth > 0 && img.getAttribute('src')) {
        onLoad({
          target: img,
          currentTarget: img,
          cacheType: 'memory',
        } as unknown as React.SyntheticEvent<HTMLImageElement>);
      }
    }, []);

    if (!sourceWithHeaders) {
      return null;
    }
    return (
      <>
        <ColorTintFilter id={tintId} tintColor={tintColor} />
        <img
          ref={setRef}
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
          loading={loading || undefined}
          draggable={draggable}
          {...handlers}
          onLoad={onLoad}
          {...getImgPropsFromSource(source)}
          {...props}
        />
      </>
    );
  }
);

export default ImageWrapper;
