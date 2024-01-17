import { Subscription } from 'expo-modules-core';
import { AudioSource } from './Audio.types';
import { AudioCategory, AudioPlayer, AudioRecorder, AudioStatus, RecordingStatus } from './AudioModule.types';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, statusListener?: (status: AudioStatus) => void): AudioPlayer;
export declare function useAudioRecorder(url?: string | null): AudioRecorder;
export declare function addStatusUpdateListener(listener: (event: AudioStatus) => void): Subscription;
export declare function addRecordingStatusListener(listener: (event: RecordingStatus) => void): Subscription;
export declare function setIsAudioActive(enabled: boolean): void;
export declare function setAudioCategory(category: AudioCategory): void;
export { AudioStatus as ChangeEventPayload, AudioSource };
//# sourceMappingURL=index.d.ts.map