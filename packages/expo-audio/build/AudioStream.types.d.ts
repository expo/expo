import type { SharedObject } from 'expo-modules-core';
export type AudioStreamEncoding = 'float32' | 'int16';
export type AudioStreamOptions = {
    /**
     * Desired sample rate in Hz.
     * The actual rate may differ if the hardware cannot deliver it.
     * @default 48000
     */
    sampleRate?: number;
    /**
     * Number of audio channels. 1 for mono, 2 for stereo.
     * @default 1
     */
    channels?: number;
    /**
     * PCM encoding format.
     * @default 'float32'
     */
    encoding?: AudioStreamEncoding;
    /**
     * Called each time a new PCM buffer is captured from the microphone.
     */
    onBuffer?: (buffer: AudioStreamBuffer) => void;
};
export type AudioStreamBuffer = {
    /**
     * Raw PCM audio data.
     * - `'float32'`: 4 bytes per sample, values between -1.0 and 1.0
     * - `'int16'`: 2 bytes per sample, little-endian signed integers
     *
     * For multi-channel audio, samples are interleaved: [L, R, L, R, ...].
     */
    data: ArrayBuffer;
    /** Actual sample rate in Hz. May differ from the requested rate. */
    sampleRate: number;
    /** Actual number of channels. */
    channels: number;
    /** Seconds since the stream was started. */
    timestamp: number;
};
export type AudioStreamStatus = {
    isStreaming: boolean;
};
export type AudioStreamEvents = {
    audioStreamBuffer(buffer: AudioStreamBuffer): void;
    audioStreamStatus(status: AudioStreamStatus): void;
};
export type AudioStreamResult = {
    stream: AudioStream;
    isStreaming: boolean;
};
/**
 * A native audio stream that captures PCM audio from the microphone in real-time.
 */
export declare class AudioStream extends SharedObject<AudioStreamEvents> {
    /** @hidden */
    constructor(options: {
        sampleRate: number;
        channels: number;
        encoding: string;
    });
    id: string;
    /** Actual sample rate being delivered, in Hz. Available after `start()`. */
    readonly sampleRate: number;
    /** Actual number of channels being delivered. Available after `start()`. */
    readonly channels: number;
    readonly isStreaming: boolean;
    /**
     * Begins capturing audio from the microphone.
     * Requires microphone permission — call `requestRecordingPermissionsAsync()` first.
     */
    start(): Promise<void>;
    /** Stops capturing and releases native audio resources. */
    stop(): void;
}
//# sourceMappingURL=AudioStream.types.d.ts.map