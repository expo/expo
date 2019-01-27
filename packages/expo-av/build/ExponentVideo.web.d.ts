import * as React from 'react';
import { View } from 'react-native';
import { PlaybackNativeSource, PlaybackStatus, PlaybackStatusToSet } from './AV';
declare type ExponentVideoProps = {
    source: PlaybackNativeSource | null;
    resizeMode?: Object;
    status?: PlaybackStatusToSet;
    useNativeControls?: boolean;
    onStatusUpdate?: (event: {
        nativeEvent: PlaybackStatus;
    }) => void;
    onReadyForDisplay?: (event: {
        nativeEvent: Object;
    }) => void;
    onFullscreenUpdate?: (event: {
        nativeEvent: Object;
    }) => void;
    onLoadStart: () => void;
    onLoad: (event: {
        nativeEvent: PlaybackStatus;
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
} & React.ComponentProps<typeof View>;
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
    onRef: (ref: HTMLVideoElement) => void;
    render(): JSX.Element;
}
export {};
