import React from 'react';
import { VideoPlayer, VideoViewProps } from './VideoView.types';
declare class VideoPlayerWeb implements VideoPlayer {
    constructor(source?: string | null);
    src: string | null;
    _mountedVideos: Set<HTMLVideoElement>;
    _audioNodes: Set<MediaElementAudioSourceNode>;
    isPlaying: boolean;
    _isMuted: boolean;
    _volume: number;
    _isLooping: boolean;
    _playbackRate: number;
    _shouldCorrectPitch: boolean;
    staysActiveInBackground: boolean;
    set isMuted(value: boolean);
    get isMuted(): boolean;
    set rate(value: number);
    get rate(): number;
    set volume(value: number);
    get volume(): number;
    set isLooping(value: boolean);
    get isLooping(): boolean;
    get positionMillis(): number;
    set positionMillis(value: number);
    get shouldCorrectPitch(): boolean;
    set shouldCorrectPitch(value: boolean);
    mountVideoView(video: HTMLVideoElement): void;
    unmountVideoView(video: HTMLVideoElement): void;
    play(): void;
    pause(): void;
    replace(source: string): void;
    seekBy(seconds: number): void;
    replay(): void;
    _synchronizeWithFirstVideo(video: HTMLVideoElement): void;
    _addListeners(video: HTMLVideoElement): void;
}
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare const VideoView: React.ForwardRefExoticComponent<{
    player?: VideoPlayerWeb | undefined;
} & VideoViewProps & React.RefAttributes<unknown>>;
export default VideoView;
//# sourceMappingURL=VideoView.web.d.ts.map