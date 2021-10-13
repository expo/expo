import * as React from 'react';
import { ViewProps } from 'react-native';
import { AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
import { VideoFullscreenUpdateEvent, VideoReadyForDisplayEvent } from './Video.types';
declare type ExponentVideoProps = {
    source: AVPlaybackNativeSource | null;
    resizeMode?: object;
    status?: AVPlaybackStatusToSet;
    useNativeControls?: boolean;
    onStatusUpdate?: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onReadyForDisplay?: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    onFullscreenUpdate?: (event: {
        nativeEvent: VideoFullscreenUpdateEvent;
    }) => void;
    onLoadStart: () => void;
    onLoad: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onError: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    scaleX?: number;
    scaleY?: number;
    translateX?: number;
    translateY?: number;
    rotation?: number;
} & ViewProps;
export declare type NaturalSize = {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
};
export declare const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export declare const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export declare const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export declare const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export default class ExponentVideo extends React.Component<ExponentVideoProps> {
    _video?: HTMLVideoElement;
    _removeFullscreenListener?: () => any;
    componentWillUnmount(): void;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onStatusUpdate: () => Promise<void>;
    onLoadStart: () => void;
    onLoadedData: (event: any) => void;
    onError: (event: any) => void;
    onProgress: () => void;
    onSeeking: () => void;
    onEnded: () => void;
    onLoadedMetadata: () => void;
    onCanPlay: (event: any) => void;
    onStalled: () => void;
    onRef: (ref: HTMLVideoElement | null) => void;
    render(): JSX.Element;
}
export {};
