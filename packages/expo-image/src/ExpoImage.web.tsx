import React from 'react';

import {
  ImageContentPositionObject,
  ImageSource,
  ImageTransition,
  ImageTransitionEffect,
  ImageTransitionTiming,
  ImageNativeProps,
  PositionValue,
} from './Image.types';

function ensureUnit(value: string | number) {
  const trimmedValue = String(value).trim();
  if (trimmedValue.endsWith('%')) {
    return trimmedValue;
  }
  return `${trimmedValue}px`;
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

function getObjectPositionFromContentPositionObject(
  contentPosition?: ImageContentPositionObject
): string {
  const resolvedPosition = { ...contentPosition } as Record<
    KeysOfUnion<ImageContentPositionObject>,
    PositionValue
  >;
  if (!resolvedPosition) {
    return '50% 50%';
  }
  if (resolvedPosition.top == null && resolvedPosition.bottom == null) {
    resolvedPosition.top = '50%';
  }
  if (resolvedPosition.left == null && resolvedPosition.right == null) {
    resolvedPosition.left = '50%';
  }

  return (
    ['top', 'bottom', 'left', 'right']
      .map((key) => {
        if (key in resolvedPosition) {
          return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
      })
      .join(' ') || '50% 50%'
  );
}

type ImageState = 'empty' | 'loading' | 'loaded' | 'error';

function useImageState(source?: ImageSource[]) {
  const hasAnySource = source && source.length > 0;
  const [imageState, setImageState] = React.useState<ImageState>(
    hasAnySource ? 'loading' : 'empty'
  );
  React.useEffect(() => {
    setImageState((prevState) =>
      prevState === 'empty' ? (hasAnySource ? 'loading' : 'empty') : prevState
    );
  }, [hasAnySource]);

  const onLoad = React.useCallback(
    () => setImageState((prevState) => (imageState === 'loading' ? 'loaded' : prevState)),
    []
  );
  const handlers = React.useMemo(
    () => ({
      onLoad,
    }),
    [onLoad]
  );
  return [imageState, handlers] as [ImageState, { onLoad: () => void }];
}

function getCSSTiming(timing?: ImageTransitionTiming) {
  return (
    {
      [ImageTransitionTiming.EASE_IN]: 'ease-in',
      [ImageTransitionTiming.EASE_OUT]: 'ease-out',
      [ImageTransitionTiming.EASE_IN_OUT]: 'ease-in-out',
      [ImageTransitionTiming.LINEAR]: 'linear',
    }[timing || ImageTransitionTiming.LINEAR] ?? 'linear'
  );
}

function getTransitionObjectFromTransition(transition?: number | ImageTransition | null) {
  if (transition == null) {
    return {
      timing: ImageTransitionTiming.LINEAR,
      duration: 0,
      effect: ImageTransitionEffect.NONE,
    };
  }
  if (typeof transition === 'number') {
    return {
      timing: ImageTransitionTiming.EASE_IN_OUT,
      duration: transition,
      effect: ImageTransitionEffect.CROSS_DISOLVE,
    };
  }
  return {
    timing: ImageTransitionTiming.EASE_IN_OUT,
    duration: 1000,
    ...transition,
  };
}

const useTransition = (
  transition: number | ImageTransition | null | undefined,
  state: ImageState
): Record<'placeholder' | 'image', Partial<React.CSSProperties>> => {
  const { duration, timing, effect } = getTransitionObjectFromTransition(transition);
  if (effect === ImageTransitionEffect.CROSS_DISOLVE) {
    const commonStyles = {
      transition: `opacity ${duration}ms`,
      transitionTimingFunction: getCSSTiming(timing),
    };
    return {
      image: {
        opacity: state === 'loaded' ? '1' : '0',
        ...commonStyles,
      },
      placeholder: {
        opacity: state === 'loaded' ? '0' : '1',
        ...commonStyles,
      },
    };
  }
  if (effect === ImageTransitionEffect.FLIP_FROM_TOP) {
    const commonStyles = {
      transition: `transform ${duration}ms`,
      transformOrigin: 'top',
      transitionTimingFunction: getCSSTiming(timing),
    };
    return {
      placeholder: {
        transform: `rotateX(${state !== 'loaded' ? '0' : '90deg'})`,
        ...commonStyles,
      },
      image: {
        transform: `rotateX(${state === 'loaded' ? '0' : '90deg'})`,
        ...commonStyles,
      },
    };
  }

  return { placeholder: {}, image: {} };
};

export default function ExpoImage({
  source,
  placeholder,
  contentFit,
  contentPosition,
  onLoad,
  transition,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}: ImageNativeProps) {
  const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
  const [state, handlers] = useImageState(source);
  const { placeholder: placeholderStyle, image: imageStyle } = useTransition(transition, state);

  return (
    <div
      style={{
        aspectRatio: String(aspectRatio),
        backgroundColor: backgroundColor?.toString(),
        transform: transform?.toString(),
        borderColor: borderColor?.toString(),
        ...style,
        overflow: 'hidden',
        position: 'relative',
      }}>
      <img
        src={placeholder?.[0]?.uri}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          objectFit: 'scale-down',
          objectPosition: 'center',
          ...placeholderStyle,
        }}
      />
      <img
        src={source?.[0]?.uri}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          objectFit: contentFit,
          objectPosition: getObjectPositionFromContentPositionObject(contentPosition),
          ...imageStyle,
        }}
        onLoad={handlers.onLoad}
      />
    </div>
  );
}
