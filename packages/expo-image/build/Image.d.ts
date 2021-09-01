import React from 'react';
import { AccessibilityProps, ImageResizeMode, ImageSourcePropType, ImageStyle as RNImageStyle, NativeSyntheticEvent, StyleProp } from 'react-native';
import { ImageErrorEventData, ImageLoadEventData, ImageLoadProgressEventData, ImagePrefetchCallback } from './Image.types';
interface ImageStyle extends RNImageStyle {
    elevation?: number;
}
export interface ImageProps extends AccessibilityProps {
    source?: ImageSourcePropType | null;
    style?: StyleProp<ImageStyle>;
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
     * **Available on @Android only.** Caches the image that can be later used in ImageView
     *
     * @param url The remote location of the image.
     *
     * @param callback The function that will be called with the `requestId`. Callback is performed before the prefetch starts.
     * You can use `abortPrefetch` only after prefetching has started.
     *
     * @return an empty promise.
     */
    static prefetch(url: string, callback?: ImagePrefetchCallback): Promise<void>;
    /**
     * **Available on @Android only.** Aborts prefetching the image.
     *
     * @param requestId Number which is returned in `prefetch` callback.
     *
     */
    static abortPrefetch(requestId: number): void;
    state: {
        onLoad: undefined;
        onError: undefined;
    };
    render(): JSX.Element;
}
export {};
