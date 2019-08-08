import React from 'react';
import { View } from 'react-native';
declare type Props = React.ComponentProps<typeof View> & {
    iconSize: number;
    iconColor?: string;
    orientation: 'horizontal' | 'vertical';
};
export default class AdOptionsView extends React.Component<Props> {
    static defaultProps: {
        iconSize: number;
        orientation: string;
    };
    shouldAlignHorizontal: () => boolean;
    render(): JSX.Element;
}
export declare type NativeAdOptionsView = React.Component<Props>;
export declare const NativeAdOptionsView: React.ComponentType<any>;
export {};
