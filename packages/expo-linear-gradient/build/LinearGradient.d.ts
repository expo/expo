import * as React from 'react';
import { View } from 'react-native';
export declare type LinearGradientProps = {
    colors: string[];
    locations?: number[] | null;
    start?: LinearGradienPoint | null;
    end?: LinearGradienPoint | null;
} & React.ComponentProps<typeof View>;
export declare type LinearGradienPoint = {
    x: number;
    y: number;
} | [number, number];
export default class LinearGradient extends React.Component<LinearGradientProps> {
    render(): JSX.Element;
}
