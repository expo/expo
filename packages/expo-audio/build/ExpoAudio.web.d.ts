import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioPlayerOptions, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import { AudioPlayer, AudioRecorder, AudioSample } from './AudioModule.types';
import * as AudioModule from './AudioModule.web';
export declare function createAudioPlayer(source?: AudioSource | string | number | null, options?: AudioPlayerOptions): AudioPlayer;
export declare function useAudioPlayer(source?: AudioSource | string | number | null, options?: AudioPlayerOptions): AudioModule.AudioPlayerWeb;
export declare function useAudioPlayerStatus(player: AudioModule.AudioPlayerWeb): AudioStatus;
export declare function useAudioSampleListener(player: AudioModule.AudioPlayerWeb, listener: (data: AudioSample) => void): void;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioModule.AudioRecorderWeb;
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export { AudioModule };
//# sourceMappingURL=ExpoAudio.web.d.ts.map