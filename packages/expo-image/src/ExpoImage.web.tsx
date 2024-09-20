import React from 'react';
import { View } from 'react-native-web';

import type { ImageNativeProps, ImageSource, ImageLoadEventData, ImageRef } from './Image.types';
import AnimationManager, { AnimationManagerNode } from './web/AnimationManager';
import ImageWrapper from './web/ImageWrapper';
import loadStyle from './web/imageStyles';
import useSourceSelection from './web/useSourceSelection';

loadStyle();

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

// Used for flip transitions to mimic native animations
function setCssVariablesForFlipTransitions(element: HTMLElement, size: DOMRect) {
  element?.style.setProperty('--expo-image-width', `${size.width}px`);
  element?.style.setProperty('--expo-image-height', `${size.height}px`);
}

function isFlipTransition(transition: ImageNativeProps['transition']) {
  return (
    transition?.effect === 'flip-from-bottom' ||
    transition?.effect === 'flip-from-top' ||
    transition?.effect === 'flip-from-left' ||
    transition?.effect === 'flip-from-right'
  );
}

function getAnimationKey(
  source: ImageSource | ImageRef | undefined,
  recyclingKey?: string | null
): string {
  const uri = (source && 'uri' in source && source.uri) || '';
  return recyclingKey ? [recyclingKey, uri].join('-') : uri;
}

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
  onDisplay,
  priority,
  blurRadius,
  recyclingKey,
  style,
  nativeViewRef,
  accessibilityLabel,
  tintColor,
  containerViewRef,
  ...props
}: ImageNativeProps) {
  const imagePlaceholderContentFit = placeholderContentFit || 'scale-down';
  const imageHashStyle = {
    objectFit: placeholderContentFit || contentFit,
  };
  const selectedSource = useSourceSelection(
    source,
    responsivePolicy,
    containerViewRef as React.MutableRefObject<HTMLDivElement | null>,
    isFlipTransition(transition) ? setCssVariablesForFlipTransitions : null
  );

  const initialNodeAnimationKey = getAnimationKey(placeholder?.[0], recyclingKey);
  const initialNode: AnimationManagerNode | null = placeholder?.[0]?.uri
    ? [
        initialNodeAnimationKey,
        ({ onAnimationFinished }) =>
          (className, style) => (
            <ImageWrapper
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
              accessibilityLabel={accessibilityLabel}
              cachePolicy={cachePolicy}
              priority={priority}
              tintColor={tintColor}
            />
          ),
      ]
    : null;

  const currentNodeAnimationKey = getAnimationKey(selectedSource ?? placeholder?.[0], recyclingKey);
  const currentNode: AnimationManagerNode = [
    currentNodeAnimationKey,
    ({ onAnimationFinished, onReady, onMount, onError: onErrorInner }) =>
      (className, style) => (
        <ImageWrapper
          ref={nativeViewRef as React.Ref<HTMLImageElement> | undefined}
          source={selectedSource || placeholder?.[0]}
          events={{
            onError: [onErrorAdapter(onError), onLoadEnd, onErrorInner],
            onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
            onMount: [onMount],
            onTransitionEnd: [onAnimationFinished],
            onDisplay: [onDisplay],
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
          accessibilityLabel={accessibilityLabel}
          tintColor={tintColor}
        />
      ),
  ];
  return (
    <View
      ref={containerViewRef}
      dataSet={{ expoimage: true }}
      style={[{ overflow: 'hidden' }, style]}
      {...props}>
      <AnimationManager transition={transition} recyclingKey={recyclingKey} initial={initialNode}>
        {currentNode}
      </AnimationManager>
    </View>
  );
}
