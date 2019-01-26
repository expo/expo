import React from 'react';
import { View } from 'react-native';
declare type Props = {
    colors: number[];
    locations?: number[] | null;
    startPoint?: Point | null;
    endPoint?: Point | null;
} & React.ComponentProps<typeof View>;
declare type Point = [number, number];
export default class NativeLinearGradient extends React.Component<Props> {
    render(): JSX.Element;
}
export {};
