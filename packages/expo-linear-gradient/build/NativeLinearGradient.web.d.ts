import React, { FunctionComponent } from 'react';
import { View } from 'react-native';
declare type Props = {
    colors: number[];
    locations?: number[] | null;
    startPoint?: Point | null;
    endPoint?: Point | null;
    onLayout?: Function;
} & React.ComponentProps<typeof View>;
declare type Point = [number, number];
declare const NativeLinearGradient: FunctionComponent<Props>;
export default NativeLinearGradient;
