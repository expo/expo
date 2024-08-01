import { ImageContentPositionObject, ImageContentPositionValue } from '../Image.types';

export function ensureValueIsWebUnits(value: string | number) {
  const trimmedValue = String(value).trim();
  if (trimmedValue.endsWith('%')) {
    return trimmedValue;
  }
  return `${trimmedValue}px`;
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

export const absoluteFilledPosition = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  left: 0,
  top: 0,
} as const;

export function getObjectPositionFromContentPositionObject(
  contentPosition?: ImageContentPositionObject
): string {
  const resolvedPosition = { ...contentPosition } as Record<
    KeysOfUnion<ImageContentPositionObject>,
    ImageContentPositionValue
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
          return `${key} ${ensureValueIsWebUnits(resolvedPosition[key])}`;
        }
        return '';
      })
      .join(' ') || '50% 50%'
  );
}
