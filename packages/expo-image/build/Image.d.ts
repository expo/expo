import React from 'react';
import { AccessibilityProps, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';
export interface ImageProps extends AccessibilityProps {
    source?: ImageSourcePropType | null;
    style?: StyleProp<ImageStyle>;
}
export default class Image extends React.Component<ImageProps> {
    render(): JSX.Element;
}
