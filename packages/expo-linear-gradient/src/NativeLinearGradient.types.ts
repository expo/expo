import type { PropsWithChildren } from 'react';
import type { ColorValue, ViewProps } from 'react-native';

export type NativeLinearGradientProps = ViewProps &
  PropsWithChildren<{
    colors: readonly ColorValue[];
    locations?: readonly number[] | null;
    startPoint?: NativeLinearGradientPoint | null;
    endPoint?: NativeLinearGradientPoint | null;
    dither?: boolean;
  }>;

export type getLinearGradientBackgroundImage = (
  colors: readonly ColorValue[],
  width?: number,
  height?: number,
  locations?: readonly number[] | null,
  startPoint?: NativeLinearGradientPoint | null,
  endPoint?: NativeLinearGradientPoint | null
) => string;

/**
 * A tuple `[x, y]` that represents the point at which the gradient starts or ends,
 * as a fraction of the overall size of the gradient ranging from `0` to `1`, inclusive.
 */
export type NativeLinearGradientPoint = [x: number, y: number];
