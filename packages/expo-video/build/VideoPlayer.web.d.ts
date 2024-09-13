import type { PlayerError, VideoPlayer, VideoPlayerEvents, VideoPlayerStatus, VideoSource } from './VideoPlayer.types';
export declare function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer;
export declare function getSourceUri(source: VideoSource): string | null;
export default class VideoPlayerWeb extends globalThis.expo.SharedObject<VideoPlayerEvents> implements VideoPlayer {
    constructor(source: VideoSource);
    src: VideoSource;
    previousSrc: VideoSource;
    _mountedVideos: Set<HTMLVideoElement>;
    _audioNodes: Set<MediaElementAudioSourceNode>;
    playing: boolean;
    _muted: boolean;
    _volume: number;
    _loop: boolean;
    _playbackRate: number;
    _preservesPitch: boolean;
    _status: VideoPlayerStatus;
    _error: PlayerError | null;
    _timeUpdateLoop: number | null;
    _timeUpdateEventInterval: number;
    allowsExternalPlayback: boolean;
    staysActiveInBackground: boolean;
    showNowPlayingNotification: boolean;
    currentLiveTimestamp: number | null;
    currentOffsetFromLive: number | null;
    targetOffsetFromLive: number;
    set muted(value: boolean);
    get muted(): boolean;
    set playbackRate(value: number);
    get playbackRate(): number;
    get isLive(): boolean;
    set volume(value: number);
    get volume(): number;
    set loop(value: boolean);
    get loop(): boolean;
    get currentTime(): number;
    set currentTime(value: number);
    get duration(): number;
    get preservesPitch(): boolean;
    set preservesPitch(value: boolean);
    get timeUpdateEventInterval(): number;
    set timeUpdateEventInterval(value: number);
    get status(): VideoPlayerStatus;
    private set status(value);
    mountVideoView(video: HTMLVideoElement): void;
    unmountVideoView(video: HTMLVideoElement): void;
    mountAudioNode(audioContext: AudioContext, zeroGainNode: GainNode, audioSourceNode: MediaElementAudioSourceNode): void;
    unmountAudioNode(video: HTMLVideoElement, audioContext: AudioContext, audioSourceNode: MediaElementAudioSourceNode): void;
    play(): void;
    pause(): void;
    replace(source: VideoSource): void;
    seekBy(seconds: number): void;
    replay(): void;
    _synchronizeWithFirstVideo(video: HTMLVideoElement): void;
    /**
     * If there are multiple mounted videos, all of them will emit an event, as they are synchronised.
     * We want to avoid this, so we only emit the event if it came from the first video.
     */
    _emitOnce<EventName extends keyof VideoPlayerEvents>(eventSource: HTMLVideoElement, eventName: EventName, ...args: Parameters<VideoPlayerEvents[EventName]>): void;
    _addListeners(video: HTMLVideoElement): void;
}
//# sourceMappingURL=VideoPlayer.web.d.ts.map