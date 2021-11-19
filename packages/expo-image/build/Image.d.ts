import React from 'react';
import { AccessibilityProps, ImageResizeMode, ImageSourcePropType, ImageStyle as RNImageStyle, NativeSyntheticEvent, StyleProp } from 'react-native';
import { ImageErrorEventData, ImageLoadEventData, ImageLoadProgressEventData } from './Image.types';
interface ImageStyle extends RNImageStyle {
    elevation?: number;
}
export interface ImageProps extends AccessibilityProps {
    source?: ImageSourcePropType | null;
    style?: StyleProp<ImageStyle>;
    defaultSource?: ImageSourcePropType | null;
    loadingIndicatorSource?: ImageSourcePropType | null;
    resizeMode?: ImageResizeMode;
    /**
     * @Android only
     */
    blurRadius?: number;
    fadeDuration?: number;
    onLoadStart?: () => void;
    onProgress?: (event: NativeSyntheticEvent<ImageLoadProgressEventData>) => void;
    onLoad?: (event: NativeSyntheticEvent<ImageLoadEventData>) => void;
    onError?: (error: NativeSyntheticEvent<ImageErrorEventData>) => void;
    onLoadEnd?: () => void;
}
interface ImageState {
    onLoad: ImageProps['onLoad'];
    onError: ImageProps['onError'];
}
export default class Image extends React.Component<ImageProps, ImageState> {
    static getDerivedStateFromProps(props: ImageProps): {
        onLoad: ((event: NativeSyntheticEvent<ImageLoadEventData>) => void) | undefined;
        onError: ((error: NativeSyntheticEvent<ImageErrorEventData>) => void) | undefined;
    };
    /**
     * **Available on @Android only.** Caching the image that can be later used in ImageView
     * @return an empty promise.
     */
    static prefetch(url: string): Promise<void>;
    state: {
        onLoad: undefined;
        onError: undefined;
    };
    render(): JSX.Element;
}
export {};
