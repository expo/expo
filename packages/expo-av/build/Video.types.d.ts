import * as React from 'react';
import { ImageProps, View } from 'react-native';
import { AVPlaybackNativeSource, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
export declare type VideoNaturalSize = {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
};
export declare enum ResizeMode {
    CONTAIN = "contain",
    COVER = "cover",
    STRETCH = "stretch"
}
export declare type VideoReadyForDisplayEvent = {
    naturalSize: VideoNaturalSize;
    status: AVPlaybackStatus;
};
export declare type VideoFullscreenUpdateEvent = {
    fullscreenUpdate: 0 | 1 | 2 | 3;
    status: AVPlaybackStatus;
};
export declare type VideoProps = {
    source?: AVPlaybackSource;
    posterSource?: ImageProps['source'];
    posterStyle?: ImageProps['style'];
    onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
    onLoadStart?: () => void;
    onLoad?: (status: AVPlaybackStatus) => void;
    onError?: (error: string) => void;
    onReadyForDisplay?: (event: VideoReadyForDisplayEvent) => void;
    onFullscreenUpdate?: (event: VideoFullscreenUpdateEvent) => void;
    onIOSFullscreenUpdate?: (event: VideoFullscreenUpdateEvent) => void;
    useNativeControls?: boolean;
    resizeMode?: ResizeMode | 'stretch' | 'cover' | 'contain';
    usePoster?: boolean;
    status?: AVPlaybackStatusToSet;
    progressUpdateIntervalMillis?: number;
    positionMillis?: number;
    shouldPlay?: boolean;
    rate?: number;
    shouldCorrectPitch?: boolean;
    volume?: number;
    isMuted?: boolean;
    isLooping?: boolean;
    scaleX?: number;
    scaleY?: number;
    translateX?: number;
    translateY?: number;
    rotation?: number;
} & React.ComponentProps<typeof View>;
export declare type VideoNativeProps = {
    source?: AVPlaybackNativeSource | null;
    resizeMode?: unknown;
    status?: AVPlaybackStatusToSet;
    onLoadStart?: () => void;
    onLoad?: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onError?: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    onStatusUpdate?: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onReadyForDisplay?: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    onFullscreenUpdate?: (event: {
        nativeEvent: VideoFullscreenUpdateEvent;
    }) => void;
    useNativeControls?: boolean;
} & React.ComponentProps<typeof View>;
export declare type VideoState = {
    showPoster: boolean;
};
export declare type ExponentVideoComponent = React.ComponentClass<VideoNativeProps>;
