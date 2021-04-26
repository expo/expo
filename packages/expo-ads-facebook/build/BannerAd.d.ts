import React from 'react';
import { View } from 'react-native';
declare type Props = {
    placementId: string;
    type: BannerAdType;
    onPress?: () => void;
    onError?: (error: Error) => void;
} & React.ComponentProps<typeof View>;
declare type BannerAdType = 'large' | 'rectangle' | 'standard';
export default class BannerAd extends React.Component<Props> {
    render(): JSX.Element;
}
export {};
