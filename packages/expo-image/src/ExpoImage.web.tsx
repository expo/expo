import React from 'react';

import {
  ImageContentPosition,
  ImageContentPositionObject,
  ImageProps,
  ImageSource,
  PositionValue,
} from './Image.types';
import { resolveContentFit, resolveContentPosition } from './utils';

function resolveAssetSource(source?: ImageSource | string | number | null) {
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

const ensureIsArray = <T extends any>(source: T | T[] | undefined) => {
  if (Array.isArray(source)) {
    return source;
  }
  if (source == null) {
    return [];
  }
  return [source];
};

export default function ExpoImage({
  source,
  defaultSource,
  loadingIndicatorSource,
  contentPosition,
  onLoad,
  onLoadStart,
  onLoadEnd,
  onError,
  ...props
}: ImageProps) {
  const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
  const resolvedSources = ensureIsArray(source).map(resolveAssetSource);
  return (
    <>
      <picture
        style={{
          overflow: 'hidden',
          ...style,
        }}>
        <img
          src={resolvedSources.at(0)?.uri}
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            objectFit: resolveContentFit(props.contentFit, props.resizeMode),
            objectPosition: getObjectPositionFromContentPosition(contentPosition) || undefined,
          }}
        />
      </picture>
    </>
  );
}
