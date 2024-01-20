import React from 'react';
import { View } from 'react-native-web';

import { ImageNativeProps, ImageSource, ImageLoadEventData } from './Image.types';
import AnimationManager, { AnimationManagerNode } from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/imageStyles';
import useSourceSelection from './web/useSourceSelection';

loadStyle();

export const ExpoImageModule = {
  async prefetch(urls: string | string[], _): Promise<boolean> {
    const urlsArray = Array.isArray(urls) ? urls : [urls];

    return new Promise<boolean>((resolve) => {
      let imagesLoaded = 0;

      urlsArray.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imagesLoaded++;

          if (imagesLoaded === urlsArray.length) {
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
      });
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

// Used for some transitions to mimic native animations
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
  cachePolicy,
  onLoad,
  transition,
  onError,
  responsivePolicy,
  onLoadEnd,
  priority,
  blurRadius,
  recyclingKey,
  style,
  nativeViewRef,
  ...props
}: ImageNativeProps) {
  const imagePlaceholderContentFit = placeholderContentFit || 'scale-down';
  const imageHashStyle = {
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
          (className, style) => (
            <ImageWrapper
              {...props}
              ref={nativeViewRef as React.Ref<HTMLImageElement> | undefined}
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
              hashPlaceholderStyle={imageHashStyle}
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
      (className, style) => (
        <ImageWrapper
          {...props}
          ref={nativeViewRef as React.Ref<HTMLImageElement> | undefined}
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
          cachePolicy={cachePolicy}
          priority={priority}
          contentPosition={selectedSource ? contentPosition : { top: '50%', left: '50%' }}
          hashPlaceholderContentPosition={contentPosition}
          hashPlaceholderStyle={imageHashStyle}
          accessibilityLabel={props.accessibilityLabel}
        />
      ),
  ];
  return (
    <View ref={containerRef} dataSet={{ expoimage: true }} style={[{ overflow: 'hidden' }, style]}>
      <AnimationManager transition={transition} recyclingKey={recyclingKey} initial={initialNode}>
        {currentNode}
      </AnimationManager>
    </View>
  );
}
