import React from 'react';
import { AccessibilityProps, ImageSourcePropType, ImageStyle, NativeSyntheticEvent, StyleProp } from 'react-native';
import { ImageErrorEventData, ImageLoadEventData, ImageLoadProgressEventData } from './Image.types';
export interface ImageProps extends AccessibilityProps {
    source?: ImageSourcePropType | null;
    style?: StyleProp<ImageStyle>;
    onLoadStart?: () => void;
    onProgress?: (event: NativeSyntheticEvent<ImageLoadProgressEventData>) => void;
    onLoad?: (event: NativeSyntheticEvent<ImageLoadEventData>) => void;
    onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
}
export default class Image extends React.Component<ImageProps> {
    render(): JSX.Element;
}
