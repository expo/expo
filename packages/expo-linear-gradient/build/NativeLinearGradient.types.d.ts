import { PropsWithChildren } from 'react';
import { ColorValue, ViewProps } from 'react-native';
export type NativeLinearGradientProps = ViewProps & PropsWithChildren<{
    colors: readonly ColorValue[];
    locations?: readonly number[] | null;
    startPoint?: NativeLinearGradientPoint | null;
    endPoint?: NativeLinearGradientPoint | null;
    dither?: boolean;
}>;
export type getLinearGradientBackgroundImage = (colors: readonly ColorValue[], width?: number, height?: number, locations?: readonly number[] | null, startPoint?: NativeLinearGradientPoint | null, endPoint?: NativeLinearGradientPoint | null) => string;
export type NativeLinearGradientPoint = [x: number, y: number];
//# sourceMappingURL=NativeLinearGradient.types.d.ts.map