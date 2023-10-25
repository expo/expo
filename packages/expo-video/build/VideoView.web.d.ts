import React from 'react';
import { VideoPlayer } from './VideoPlayer';
import { VideoViewProps } from './VideoView.types';
declare class VideoPlayerImpl implements VideoPlayer {
    src: string | null;
    mountedVideos: Set<HTMLVideoElement>;
    isPlaying: boolean;
    _isMuted: boolean;
    set isMuted(value: boolean);
    get isMuted(): boolean;
    timestamp: number;
    play(): void;
    pause(): void;
    replace(source: string): void;
    seekBy(seconds: number): void;
    replay(): void;
    constructor(source?: string | null);
}
export declare function useVideoPlayer(source?: string | null): VideoPlayer;
export declare const VideoView: React.ForwardRefExoticComponent<{
    player?: VideoPlayerImpl | undefined;
} & VideoViewProps & React.RefAttributes<unknown>>;
export default VideoView;
//# sourceMappingURL=VideoView.web.d.ts.map