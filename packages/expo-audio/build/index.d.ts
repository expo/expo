import { Subscription } from 'expo-modules-core';
import { AudioMode, AudioSource, AudioStatus, RecordingOptions, RecordingStatus } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, statusListener?: (status: AudioStatus) => void): AudioPlayer;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioRecorder;
export declare function addStatusUpdateListener(listener: (event: AudioStatus) => void): Subscription;
export declare function addRecordingStatusListener(listener: (event: RecordingStatus) => void): Subscription;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export { AudioStatus as ChangeEventPayload, AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
//# sourceMappingURL=index.d.ts.map