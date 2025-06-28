import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder, AudioSample } from './AudioModule.types';
import { PLAYBACK_STATUS_UPDATE, AUDIO_SAMPLE_UPDATE, RECORDING_STATUS_UPDATE } from './ExpoAudioEvents';
export declare function useAudioPlayer(source?: AudioSource, updateInterval?: number): AudioPlayer;
export declare function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
export declare function useAudioSampleListener(player: AudioPlayer, listener: (data: AudioSample) => void): void;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioRecorder;
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
/**
 * Creates an instance of an `AudioPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useAudioPlayer`](#useaudioplayersource-updateinterval) hook instead.
 * > See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.
 * @param source
 * @param updateInterval
 */
export declare function createAudioPlayer(source?: AudioSource | string | number | null, updateInterval?: number): AudioPlayer;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export { AudioModule };
export { PLAYBACK_STATUS_UPDATE, AUDIO_SAMPLE_UPDATE, RECORDING_STATUS_UPDATE };
//# sourceMappingURL=ExpoAudio.d.ts.map