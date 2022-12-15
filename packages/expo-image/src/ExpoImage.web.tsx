import React from 'react';

import {
  ImageContentPosition,
  ImageContentPositionObject,
  ImageProps,
  ImageSource,
  ImageTransition,
  ImageTransitionEffect,
  ImageTransitionTiming,
  ImageUriSource,
  PositionValue,
  RequireSource,
} from './Image.types';
import { resolveContentFit, resolveContentPosition } from './utils';

function resolveAssetSource(source?: ImageUriSource | RequireSource | null) {
  if (source == null) return null;

  if (typeof source === 'string') {
    return { uri: source };
  }
  if (typeof source === 'number') {
    return { uri: String(source) };
  }

  return source;
}

function ensureUnit(value: string | number) {
  const trimmedValue = String(value).trim();
  if (trimmedValue.endsWith('%')) {
    return trimmedValue;
  }
  return `${trimmedValue}px`;
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

function getObjectPositionFromContentPosition(contentPosition?: ImageContentPosition) {
  const resolvedPosition = (
    typeof contentPosition === 'string' ? resolveContentPosition(contentPosition) : contentPosition
  ) as Record<KeysOfUnion<ImageContentPositionObject>, PositionValue>;

  if (!resolvedPosition) {
    return null;
  }
  if (resolvedPosition.top == null || resolvedPosition.bottom == null) {
    resolvedPosition.top = '50%';
  }
  if (resolvedPosition.left == null || resolvedPosition.right == null) {
    resolvedPosition.left = '50%';
  }

  return ['top', 'bottom', 'left', 'right']
    .map((key) => {
      if (key in resolvedPosition) {
        return `${key} ${ensureUnit(resolvedPosition[key])}`;
      }
      return '';
    })
    .join(' ');
}

function ensureIsArray(source?: ImageSource): (ImageUriSource | RequireSource)[] {
  if (Array.isArray(source)) {
    return source;
  }
  if (source == null) {
    return [];
  }
  return [source];
}

type ImageState = 'empty' | 'loading' | 'loaded' | 'error';

function useImageState(source?: ImageSource) {
  const [imageState, setImageState] = React.useState<ImageState>(source ? 'loading' : 'empty');
  React.useEffect(() => {
    setImageState((prevState) =>
      prevState === 'empty' ? (source ? 'loading' : 'empty') : prevState
    );
  }, [source]);

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
  loadingIndicatorSource,
  contentPosition,
  onLoad,
  transition,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}: ImageProps) {
  const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
  const [state, handlers] = useImageState(source);
  const { placeholder: placeholderStyle, image: imageStyle } = useTransition(transition, state);

  const resolvedSources = ensureIsArray(source).map(resolveAssetSource);

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
        src={ensureIsArray(placeholder).map(resolveAssetSource)?.[0]?.uri}
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
        src={resolvedSources.at(0)?.uri}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          objectFit: resolveContentFit(props.contentFit, props.resizeMode),
          objectPosition: getObjectPositionFromContentPosition(contentPosition) || '50% 50%',
          ...imageStyle,
        }}
        onLoad={handlers.onLoad}
      />
    </div>
  );
}
