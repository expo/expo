import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder, AudioSample } from './AudioModule.types';
export declare const PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate";
export declare const AUDIO_SAMPLE_UPDATE = "audioSampleUpdate";
export declare const RECORDING_STATUS_UPDATE = "recordingStatusUpdate";
export declare function useAudioPlayer(source?: AudioSource | string | number | null, updateInterval?: number): AudioPlayer;
export declare function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
export declare function useAudioSampleListener(player: AudioPlayer, listener: (data: AudioSample) => void): void;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioRecorder;
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export { AudioModule };
//# sourceMappingURL=ExpoAudio.d.ts.map