import React from 'react';
import { View } from 'react-native';
declare type Props = React.ComponentProps<typeof View> & {
    iconSize: number;
    orientation: 'horizontal' | 'vertical';
};
export default class AdChoiceView extends React.Component<Props> {
    static defaultProps: {
        iconSize: number;
        orientation: string;
    };
    shouldAlignHorizontal: () => boolean;
    render(): JSX.Element;
}
export declare type NativeAdChoiceView = React.Component<Props>;
export declare const NativeAdChoiceView: React.ComponentType<any>;
export {};
