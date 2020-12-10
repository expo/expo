import * as React from 'react';
import { View } from 'react-native';
export declare type NativeLinearGradientProps = React.ComponentProps<typeof View> & React.PropsWithChildren<{
    colors: number[];
    locations?: number[] | null;
    startPoint?: NativeLinearGradientPoint | null;
    endPoint?: NativeLinearGradientPoint | null;
}>;
export declare type NativeLinearGradientPoint = [number, number];
