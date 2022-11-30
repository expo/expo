import { PropsWithChildren } from 'react';
import { ViewProps } from 'react-native';

export type NativeLinearGradientProps = ViewProps &
  PropsWithChildren<{
    colors: number[];
    locations?: number[] | null;
    startPoint?: NativeLinearGradientPoint | null;
    endPoint?: NativeLinearGradientPoint | null;
  }>;

export type getLinearGradientBackgroundImage = (
  colors: number[],
  width?: number,
  height?: number,
  locations?: number[] | null,
  startPoint?: NativeLinearGradientPoint | null,
  endPoint?: NativeLinearGradientPoint | null
) => string;

export type NativeLinearGradientPoint = [number, number];
