import React from 'react';

import { ImageContentFit, ImageContentPosition, ImageProps, ImageSource } from './Image.types';
import { resolveContentFit, resolveContentPosition } from './utils';

const resolveAssetSource = (source: ImageSource | string | undefined | null) => {
  if (source === null || source === undefined) return undefined;

  if (typeof source === 'string') {
    return { uri: source };
  }
  return source;
};

const getObjectFitFromContentFit = (contentFit?: ImageContentFit) => {
  switch (contentFit) {
    case ImageContentFit.CONTAIN:
      return 'contain';
    case ImageContentFit.COVER:
      return 'cover';
    case ImageContentFit.FILL:
      return 'fill';
    case ImageContentFit.SCALE_DOWN:
      return 'scale-down';
    case ImageContentFit.NONE:
      return 'none';
    default:
      return 'fill';
  }
};

const ensureUnit = (value: string | number) => {
  const trimmedValue = String(value).trim();
  if (trimmedValue.endsWith('%')) return trimmedValue;
  return `${trimmedValue}px`;
};

const getObjectPositionFromContentPosition = (contentPosition?: ImageContentPosition) => {
  const resolvedPosition =
    typeof contentPosition === 'string' ? resolveContentPosition(contentPosition) : contentPosition;
  if (!resolvedPosition) return undefined;
  if (!('top' in resolvedPosition || 'bottom' in resolvedPosition)) {
    (resolvedPosition as any).top = '50%';
  }
  if (!('left' in resolvedPosition || 'right' in resolvedPosition)) {
    (contentPosition as any).left = '50%';
  }
  return ['top', 'bottom', 'left', 'right']
    .map((key) => {
      if (key in resolvedPosition) {
        return `${key} ${ensureUnit(resolvedPosition[key])}`;
      }
      return '';
    })
    .join(' ');
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
  const resolvedSource = resolveAssetSource(source as ImageSource | string);
  return (
    <>
      <picture
        style={{
          overflow: 'hidden',
          ...style,
        }}>
        <source srcSet={resolvedSource?.uri} />
        <img
          src={resolvedSource?.uri}
          alt="Flowers"
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: String(aspectRatio),
            backgroundColor: backgroundColor?.toString(),
            transform: transform?.toString(),
            borderColor: borderColor?.toString(),
            objectFit: getObjectFitFromContentFit(
              resolveContentFit(props.contentFit, props.resizeMode)
            ),
            objectPosition: getObjectPositionFromContentPosition(contentPosition),
          }}
        />
      </picture>
    </>
  );
}
