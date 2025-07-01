import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, PitchCorrectionQuality, RecorderState, RecordingInput, RecordingOptions } from './Audio.types';
import { AudioPlayer, AudioEvents, RecordingEvents, AudioRecorder } from './AudioModule.types';
export declare class AudioPlayerWeb extends globalThis.expo.SharedObject<AudioEvents> implements AudioPlayer {
    private static sharedAudioContext;
    static getAudioContext(): AudioContext;
    constructor(source: AudioSource, interval: number);
    id: number;
    isAudioSamplingSupported: boolean;
    isBuffering: boolean;
    shouldCorrectPitch: boolean;
    private src;
    private media;
    private interval;
    private isPlaying;
    private loaded;
    private samplingFailedForSource;
    private workletNode;
    private workletSourceNode;
    private panner;
    private gainNode;
    /**
     * Attach the current playback chain to the `AudioWorkletNode` that powers the
     * RMS meter.
     *
     * Why not connect the `MediaElementSource` directly?  Safari delivers the
     * audio signal *before* a `GainNode` to any additional fan-out connections
     * that are created later.  That means a meter connected to the raw media
     * source would continue to see full-scale samples even when the user changes
     * `gain.value`.
     *
     * To ensure the meter reflects what the user actually hears we connect the
     * branch *after* the `GainNode` **and** after the `StereoPannerNode`.  This
     * guarantees that both volume and pan are already applied.
     *
     * WebKit quirk: disconnecting a node does not immediately stop its signal;
     * the old connection may live for one render quantum.  We therefore keep the
     * graph simple and deterministic by always detaching *all* previous paths
     * (see `_disconnectMeter`) and then attaching exactly one new path here.
     */
    private _connectMeter;
    /**
     * Detach any existing meter → worklet connections.
     *
     * We potentially connected the worklet at three different points in the
     * graph (panner, gain node, or media element) depending on which nodes were
     * available at that time.  To avoid keeping ghost connections alive we try
     * to disconnect from all three.
     */
    private _disconnectMeter;
    get playing(): boolean;
    get muted(): boolean;
    set muted(value: boolean);
    get loop(): boolean;
    set loop(value: boolean);
    get duration(): number;
    get currentTime(): number;
    get paused(): boolean;
    get isLoaded(): boolean;
    get playbackRate(): number;
    set playbackRate(value: number);
    get volume(): number;
    set volume(value: number);
    get audioPan(): number;
    set audioPan(value: number);
    get currentStatus(): AudioStatus;
    play(): void;
    pause(): void;
    replace(source: AudioSource): void;
    seekTo(seconds: number): Promise<void>;
    /** value: -1 = full left, 0 = center, +1 = full right */
    private setAudioPan;
    /**
     * Enable or disable audio sampling using AudioWorklet.
     * When enabling, if the worklet is already created, just reconnect the source node.
     * When disabling, only disconnect the source node, keeping the worklet alive.
     */
    setAudioSamplingEnabled(enabled: boolean): Promise<void>;
    private cleanupSampling;
    setPlaybackRate(second: number, pitchCorrectionQuality?: PitchCorrectionQuality): void;
    remove(): void;
    _createMediaElement(): HTMLAudioElement;
}
export declare class AudioRecorderWeb extends globalThis.expo.SharedObject<RecordingEvents> implements AudioRecorder {
    constructor(options: Partial<RecordingOptions>);
    setup(): Promise<void>;
    id: number;
    currentTime: number;
    uri: string | null;
    private options;
    private mediaRecorder;
    private mediaRecorderUptimeOfLastStartResume;
    private mediaRecorderIsRecording;
    private timeoutIds;
    get isRecording(): boolean;
    record(): void;
    getAvailableInputs(): RecordingInput[];
    getCurrentInput(): RecordingInput;
    prepareToRecordAsync(): Promise<void>;
    getStatus(): RecorderState;
    pause(): void;
    recordForDuration(seconds: number): void;
    setInput(input: string): void;
    startRecordingAtTime(seconds: number): void;
    stop(): Promise<void>;
    clearTimeouts(): void;
    private createMediaRecorder;
    private getAudioRecorderDurationMillis;
}
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
//# sourceMappingURL=AudioModule.web.d.ts.map