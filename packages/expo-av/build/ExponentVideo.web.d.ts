import * as React from 'react';
import { ViewProps } from 'react-native';
import { AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
import { VideoFullscreenUpdateEvent, VideoReadyForDisplayEvent } from './Video.types';
type ExponentVideoProps = {
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
export type NaturalSize = {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
};
export default class ExponentVideo extends React.Component<ExponentVideoProps> {
    _video?: HTMLVideoElement;
    _removeFullscreenListener?: () => any;
    componentWillUnmount(): void;
    getVideoElement: () => HTMLVideoElement | undefined;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onStatusUpdate: () => Promise<void>;
    onLoadStart: () => void;
    onLoadedData: (event: {
        nativeEvent: AVPlaybackStatus;
    }) => void;
    onError: (event: {
        nativeEvent: {
            error: string;
        };
    }) => void;
    onProgress: () => void;
    onSeeking: () => void;
    onEnded: () => void;
    onLoadedMetadata: () => void;
    onCanPlay: (event: {
        nativeEvent: VideoReadyForDisplayEvent;
    }) => void;
    onStalled: () => void;
    onRef: (ref: HTMLVideoElement | null) => void;
    render(): React.JSX.Element;
}
export {};
//# sourceMappingURL=ExponentVideo.web.d.ts.map