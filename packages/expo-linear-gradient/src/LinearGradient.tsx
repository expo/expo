import * as React from 'react';
import { Platform, processColor, View } from 'react-native';

import NativeLinearGradient from './NativeLinearGradient';
import { NativeLinearGradientPoint } from './NativeLinearGradient.types';

export type LinearGradientPoint = { x: number; y: number } | NativeLinearGradientPoint;

export type LinearGradientProps = {
  /**
   * An array of colors that represent stops in the gradient.
   * At least two colors are required.
   */
  colors: string[];
  /**
   * An array of `number`s ranging from 0 to 1, the same length as the `colors` property. Each item
   * represents where the corresponding color should be located.
   *
   * For example, `[0.5, 1.0]` would make the first color start 50% through the gradient view (the middle), and the second color 100% through the gradient (the end).
   *
   * Items must be in numeric order.
   */
  locations?: number[] | null;
  /**
   * An object `{ x: number; y: number }` or array `[x, y]` which represents the position
   * that the gradient starts at, as a fraction of the overall size of the gradient ranging from 0 to 1.
   *
   * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will start `10%` from the left and `20%` from the top.
   *
   * On web, this changes the angle of the gradient because CSS gradients don't support changing the starting position.
   */
  start?: LinearGradientPoint | null;
  /**
   * An object `{ x: number; y: number }` or array `[x, y]` which represents the position
   * that the gradient ends at, as a fraction of the overall size of the gradient ranging from 0 to 1.
   *
   * For example, `{ x: 0.1, y: 0.2 }` means that the gradient will end `10%` from the left and `20%` from the bottom.
   *
   * On web, this changes the angle of the gradient because CSS gradients don't support changing the end position.
   */
  end?: LinearGradientPoint | null;
} & React.ComponentProps<typeof View>;

/**
 * Renders a native view that transitions between multiple colors in a linear direction.
 */
export function LinearGradient({
  colors,
  locations,
  start,
  end,
  ...props
}: LinearGradientProps): React.ReactElement {
  if (locations && colors.length !== locations.length) {
    console.warn('LinearGradient colors and locations props should be arrays of the same length');
    locations = locations.slice(0, colors.length);
  }

  return (
    <NativeLinearGradient
      {...props}
      colors={Platform.select({
        web: colors as any,
        default: colors.map(processColor),
      })}
      locations={locations}
      startPoint={_normalizePoint(start)}
      endPoint={_normalizePoint(end)}
    />
  );
}

function _normalizePoint(
  point: LinearGradientPoint | null | undefined
): [number, number] | undefined {
  if (!point) {
    return undefined;
  }

  if (Array.isArray(point) && point.length !== 2) {
    console.warn('start and end props for LinearGradient must be of the format [x,y] or {x, y}');
    return undefined;
  }

  return Array.isArray(point) ? point : [point.x, point.y];
}
