import * as React from 'react';
import { View } from 'react-native';

export type NativeLinearGradientProps = React.ComponentProps<typeof View> & {
  children?: React.ReactChildren;
  colors: number[];
  locations?: number[] | null;
  startPoint?: NativeLinearGradientPoint | null;
  endPoint?: NativeLinearGradientPoint | null;
};

export type NativeLinearGradientPoint = [number, number];
