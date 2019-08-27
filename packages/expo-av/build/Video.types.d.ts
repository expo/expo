import * as React from 'react';
import { ImageProps, View } from 'react-native';
import { PlaybackNativeSource, PlaybackSource, PlaybackStatus, PlaybackStatusToSet } from './AV';
export declare type NaturalSize = {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
};
export declare enum ResizeMode {
    CONTAIN = "contain",
    COVER = "cover",
    STRETCH = "stretch"
}
export declare type ReadyForDisplayEvent = {
    naturalSize: NaturalSize;
    status: PlaybackStatus;
};
export declare type FullscreenUpdateEvent = {
    fullscreenUpdate: 0 | 1 | 2 | 3;
    status: PlaybackStatus;
};
export declare type VideoProps = {
    source?: PlaybackSource;
    posterSource?: ImageProps['source'];
    posterStyle?: ImageProps['style'];
    onPlaybackStatusUpdate?: (status: PlaybackStatus) => void;
    onLoadStart?: () => void;
    onLoad?: (status: PlaybackStatus) => void;
    onError?: (error: string) => void;
    onReadyForDisplay?: (event: ReadyForDisplayEvent) => void;
    onFullscreenUpdate?: (event: FullscreenUpdateEvent) => void;
    onIOSFullscreenUpdate?: (event: FullscreenUpdateEvent) => void;
    useNativeControls?: boolean;
    resizeMode?: ResizeMode | 'stretch' | 'cover' | 'contain';
    usePoster?: boolean;
    status?: PlaybackStatusToSet;
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
export declare type NativeProps = {
    source?: PlaybackNativeSource | null;
    resizeMode?: unknown;
    status?: PlaybackStatusToSet;
    onLoadStart?: () => void;
    onLoad?: (event: {
        nativeEvent: PlaybackStatus;
    }) => void;
    onError?: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    onStatusUpdate?: (event: {
        nativeEvent: PlaybackStatus;
    }) => void;
    onReadyForDisplay?: (event: {
        nativeEvent: ReadyForDisplayEvent;
    }) => void;
    onFullscreenUpdate?: (event: {
        nativeEvent: FullscreenUpdateEvent;
    }) => void;
    useNativeControls?: boolean;
} & React.ComponentProps<typeof View>;
export declare type VideoState = {
    showPoster: boolean;
};
export declare type ExponentVideoComponent = React.ComponentClass<NativeProps>;
