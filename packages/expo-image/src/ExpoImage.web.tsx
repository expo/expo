import React from 'react';

import { ImageNativeProps, ImageSource, ImageLoadEventData } from './Image.types';
import AnimationManager, { AnimationManagerNode } from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/style';
import useSourceSelection from './web/useSourceSelection';

loadStyle();

export const ExpoImageModule = {
  prefetch(urls: string | string[]): void {
    const urlsArray = Array.isArray(urls) ? urls : [urls];
    urlsArray.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  },

  async clearMemoryCache(): Promise<boolean> {
    return false;
  },

  async clearDiskCache(): Promise<boolean> {
    return false;
  },
};

function onLoadAdapter(onLoad?: (event: ImageLoadEventData) => void) {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
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

function onErrorAdapter(onError?: { (event: { error: string }): void }) {
  return ({ source }: { source?: ImageSource | null }) => {
    onError?.({
      error: `Failed to load image from url: ${source?.uri}`,
    });
  };
}

const setCssVariables = (element: HTMLElement, size: DOMRect) => {
  element?.style.setProperty('--expo-image-width', `${size.width}px`);
  element?.style.setProperty('--expo-image-height', `${size.height}px`);
};

export default function ExpoImage({
  source,
  placeholder,
  contentFit,
  contentPosition,
  placeholderContentFit,
  onLoad,
  transition,
  onError,
  responsivePolicy,
  onLoadEnd,
  priority,
  blurRadius,
  recyclingKey,
  ...props
}: ImageNativeProps) {
  const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
  const imagePlaceholderContentFit = placeholderContentFit || 'scale-down';
  const blurhashStyle = {
    objectFit: placeholderContentFit || contentFit,
  };
  const { containerRef, source: selectedSource } = useSourceSelection(
    source,
    responsivePolicy,
    setCssVariables
  );

  const initialNodeAnimationKey =
    (recyclingKey ? `${recyclingKey}-${placeholder?.[0]?.uri}` : placeholder?.[0]?.uri) ?? '';

  const initialNode: AnimationManagerNode | null = placeholder?.[0]?.uri
    ? [
        initialNodeAnimationKey,
        ({ onAnimationFinished }) =>
          (className, style) =>
            (
              <ImageWrapper
                {...props}
                source={placeholder?.[0]}
                style={{
                  objectFit: imagePlaceholderContentFit,
                  ...(blurRadius ? { filter: `blur(${blurRadius}px)` } : {}),
                  ...style,
                }}
                className={className}
                events={{
                  onTransitionEnd: [onAnimationFinished],
                }}
                contentPosition={{ left: '50%', top: '50%' }}
                hashPlaceholderContentPosition={contentPosition}
                hashPlaceholderStyle={blurhashStyle}
              />
            ),
      ]
    : null;

  const currentNodeAnimationKey =
    (recyclingKey
      ? `${recyclingKey}-${selectedSource?.uri ?? placeholder?.[0]?.uri}`
      : selectedSource?.uri ?? placeholder?.[0]?.uri) ?? '';

  const currentNode: AnimationManagerNode = [
    currentNodeAnimationKey,
    ({ onAnimationFinished, onReady, onMount, onError: onErrorInner }) =>
      (className, style) =>
        (
          <ImageWrapper
            {...props}
            source={selectedSource || placeholder?.[0]}
            events={{
              onError: [onErrorAdapter(onError), onLoadEnd, onErrorInner],
              onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
              onMount: [onMount],
              onTransitionEnd: [onAnimationFinished],
            }}
            style={{
              objectFit: selectedSource ? contentFit : imagePlaceholderContentFit,
              ...(blurRadius ? { filter: `blur(${blurRadius}px)` } : {}),
              ...style,
            }}
            className={className}
            priority={priority}
            contentPosition={selectedSource ? contentPosition : { top: '50%', left: '50%' }}
            hashPlaceholderContentPosition={contentPosition}
            hashPlaceholderStyle={blurhashStyle}
            accessibilityLabel={props.accessibilityLabel}
          />
        ),
  ];
  return (
    <div
      ref={containerRef}
      className="expo-image-container"
      // @ts-expect-error
      style={{
        aspectRatio: String(aspectRatio),
        backgroundColor: backgroundColor?.toString(),
        transform: transform?.toString(),
        borderColor: borderColor?.toString(),
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}>
      <AnimationManager transition={transition} recyclingKey={recyclingKey} initial={initialNode}>
        {currentNode}
      </AnimationManager>
    </div>
  );
}
