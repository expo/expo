import React from 'react';
import { VideoPlayer, VideoViewProps } from './VideoView.types';
declare class VideoPlayerWeb implements VideoPlayer {
    constructor(source?: string | null);
    src: string | null;
    mountedVideos: Set<HTMLVideoElement>;
    isPlaying: boolean;
    _isMuted: boolean;
    timestamp: number;
    volume: number;
    set isMuted(value: boolean);
    get isMuted(): boolean;
    play(): void;
    pause(): void;
    replace(source: string): void;
    seekBy(seconds: number): void;
    replay(): void;
}
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare const VideoView: React.ForwardRefExoticComponent<{
    player?: VideoPlayerWeb | undefined;
} & VideoViewProps & React.RefAttributes<unknown>>;
export default VideoView;
//# sourceMappingURL=VideoView.web.d.ts.map