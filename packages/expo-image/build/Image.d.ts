import React from 'react';
import { AccessibilityProps, ImageResizeMode, ImageSourcePropType, ImageStyle as RNImageStyle, NativeSyntheticEvent, StyleProp } from 'react-native';
import { ImageErrorEventData, ImageLoadEventData, ImageLoadProgressEventData, ImageResolvedAssetSource } from './Image.types';
interface ImageStyle extends RNImageStyle {
    elevation?: number;
}
export interface ImageProps extends AccessibilityProps {
    source?: ImageSourcePropType | null;
    style?: StyleProp<ImageStyle>;
    defaultSource?: ImageSourcePropType | null;
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
    /**
     * Resolves an asset reference into an object which has the properties `uri`, `width` and `height`
     *
     * @param source A number (opaque type returned by require('./foo.png')) or an `ImageSource`.
     *
     * @return an object constaining `uri` `width` and `height`.
     */
    static resolveAssetSource(source: ImageSourcePropType): ImageResolvedAssetSource;
    state: {
        onLoad: undefined;
        onError: undefined;
    };
    render(): JSX.Element;
}
export {};
