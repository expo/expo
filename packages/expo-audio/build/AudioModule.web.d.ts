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