import React from 'react';
import { View } from 'react-native';
declare type Props = {
    colors: number[];
    locations?: number[] | null;
    startPoint?: Point | null;
    endPoint?: Point | null;
    onLayout?: Function;
} & React.ComponentProps<typeof View>;
declare type State = {
    width?: number;
    height?: number;
};
declare type Point = [number, number];
export default class NativeLinearGradient extends React.PureComponent<Props, State> {
    state: {
        width: undefined;
        height: undefined;
    };
    onLayout: (event: any) => void;
    getControlPoints: () => [number, number][];
    calculateGradientAngleFromControlPoints: () => number;
    getWebGradientColorStyle: () => string;
    convertJSColorToGradientSafeColor: (color: number, index: number) => string;
    getGradientValues: () => string[];
    getBackgroundImage: () => string;
    render(): JSX.Element;
}
export {};
