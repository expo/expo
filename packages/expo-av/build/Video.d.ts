import * as React from 'react';
import { NativeMethods } from 'react-native';
import { Playback, AVPlaybackSource, AVPlaybackStatus, AVPlaybackStatusToSet, AVPlaybackNativeSource } from './AV';
import { ExponentVideoComponent, VideoFullscreenUpdateEvent, VideoNativeProps, VideoNaturalSize, VideoProps, VideoReadyForDisplayEvent, ResizeMode, VideoState } from './Video.types';
export { ExponentVideoComponent, VideoFullscreenUpdateEvent, VideoNativeProps, VideoNaturalSize, VideoProps, VideoReadyForDisplayEvent, ResizeMode, VideoState, AVPlaybackStatus, AVPlaybackStatusToSet, AVPlaybackNativeSource, };
export declare const FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export declare const FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export declare const FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export declare const FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT = 0;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT = 1;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS = 2;
export declare const IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS = 3;
export default class Video extends React.Component<VideoProps, VideoState> implements Playback {
    static RESIZE_MODE_CONTAIN: ResizeMode;
    static RESIZE_MODE_COVER: ResizeMode;
    static RESIZE_MODE_STRETCH: ResizeMode;
    static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT: number;
    static IOS_FULLSCREEN_UPDATE_PLAYER_DID_PRESENT: number;
    static IOS_FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS: number;
    static IOS_FULLSCREEN_UPDATE_PLAYER_DID_DISMISS: number;
    static FULLSCREEN_UPDATE_PLAYER_WILL_PRESENT: number;
    static FULLSCREEN_UPDATE_PLAYER_DID_PRESENT: number;
    static FULLSCREEN_UPDATE_PLAYER_WILL_DISMISS: number;
    static FULLSCREEN_UPDATE_PLAYER_DID_DISMISS: number;
    _nativeRef: React.RefObject<React.Component<VideoNativeProps, any, any> & NativeMethods>;
    _onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null;
    constructor(props: VideoProps);
    setNativeProps(nativeProps: VideoNativeProps): void;
    _handleNewStatus: (status: AVPlaybackStatus) => void;
    _performOperationAndHandleStatusAsync: (operation: (tag: number) => Promise<AVPlaybackStatus>) => Promise<AVPlaybackStatus>;
    _setFullscreen: (value: boolean) => Promise<AVPlaybackStatus>;
    presentFullscreenPlayer: () => Promise<AVPlaybackStatus>;
    presentIOSFullscreenPlayer: () => Promise<AVPlaybackStatus>;
    presentFullscreenPlayerAsync: () => Promise<AVPlaybackStatus>;
    dismissFullscreenPlayer: () => Promise<AVPlaybackStatus>;
    dismissIOSFullscreenPlayer: () => void;
    getStatusAsync: () => Promise<AVPlaybackStatus>;
    loadAsync: (source: AVPlaybackSource, initialStatus?: AVPlaybackStatusToSet, downloadFirst?: boolean) => Promise<AVPlaybackStatus>;
    unloadAsync: () => Promise<AVPlaybackStatus>;
    setStatusAsync: (status: AVPlaybackStatusToSet) => Promise<AVPlaybackStatus>;
    replayAsync: (status?: AVPlaybackStatusToSet) => Promise<AVPlaybackStatus>;
    setOnPlaybackStatusUpdate(onPlaybackStatusUpdate: ((status: AVPlaybackStatus) => void) | null): void;
    playAsync: () => Promise<AVPlaybackStatus>;
    playFromPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<AVPlaybackStatus>;
    pauseAsync: () => Promise<AVPlaybackStatus>;
    stopAsync: () => Promise<AVPlaybackStatus>;
    setPositionAsync: (positionMillis: number, tolerances?: {
        toleranceMillisBefore?: number;
        toleranceMillisAfter?: number;
    }) => Promise<AVPlaybackStatus>;
    setRateAsync: (rate: number, shouldCorrectPitch: boolean) => Promise<AVPlaybackStatus>;
    setVolumeAsync: (volume: number) => Promise<AVPlaybackStatus>;
    setIsMutedAsync: (isMuted: boolean) => Promise<AVPlaybackStatus>;
    setIsLoopingAsync: (isLooping: boolean) => Promise<AVPlaybackStatus>;
    setProgressUpdateIntervalAsync: (progressUpdateIntervalMillis: number) => Promise<AVPlaybackStatus>;
    _nativeOnPlaybackStatusUpdate: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    _nativeOnLoadStart: () => void;
    _nativeOnLoad: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    _nativeOnError: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    _nativeOnReadyForDisplay: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    _nativeOnFullscreenUpdate: (event: {
        nativeEvent: VideoFullscreenUpdateEvent;
    }) => void;
    _renderPoster: () => JSX.Element | null;
    render(): JSX.Element;
}
