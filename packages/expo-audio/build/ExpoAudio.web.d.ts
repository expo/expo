import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import { AudioRecorder, AudioSample } from './AudioModule.types';
import * as AudioModule from './AudioModule.web';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, updateInterval?: number): AudioModule.AudioPlayerWeb;
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