import React from 'react';
import { VideoPlayer, VideoViewProps } from './VideoView.types';
declare class VideoPlayerWeb implements VideoPlayer {
    constructor(source?: string | null);
    src: string | null;
    _mountedVideos: Set<HTMLVideoElement>;
    _audioNodes: Set<MediaElementAudioSourceNode>;
    playing: boolean;
    _muted: boolean;
    _volume: number;
    _loop: boolean;
    _playbackRate: number;
    _preservesPitch: boolean;
    staysActiveInBackground: boolean;
    set muted(value: boolean);
    get muted(): boolean;
    set playbackRate(value: number);
    get playbackRate(): number;
    set volume(value: number);
    get volume(): number;
    set loop(value: boolean);
    get loop(): boolean;
    get currentTime(): number;
    set currentTime(value: number);
    get preservesPitch(): boolean;
    set preservesPitch(value: boolean);
    mountVideoView(video: HTMLVideoElement): void;
    unmountVideoView(video: HTMLVideoElement): void;
    play(): void;
    pause(): void;
    replace(source: string): void;
    seekBy(seconds: number): void;
    replay(): void;
    _synchronizeWithFirstVideo(video: HTMLVideoElement): void;
    _addListeners(video: HTMLVideoElement): void;
    release(): void;
    addListener<EventName extends never>(eventName: EventName, listener: Record<never, never>[EventName]): void;
    removeListener<EventName extends never>(eventName: EventName, listener: Record<never, never>[EventName]): void;
    removeAllListeners(eventName: never): void;
    emit<EventName extends never>(eventName: EventName, ...args: Parameters<Record<never, never>[EventName]>): void;
}
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare const VideoView: React.ForwardRefExoticComponent<{
    player?: VideoPlayerWeb | undefined;
} & VideoViewProps & React.RefAttributes<unknown>>;
export default VideoView;
//# sourceMappingURL=VideoView.web.d.ts.map