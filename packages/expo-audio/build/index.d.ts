import { Subscription } from 'expo-modules-core';
import { AudioSource } from './Audio.types';
import { AudioCategory, AudioPlayer, StatusEvent } from './AudioModule.types';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, statusListener?: (status: StatusEvent) => void): AudioPlayer;
export declare function addStatusUpdateListener(listener: (event: StatusEvent) => void): Subscription;
export declare function setIsAudioActive(enabled: boolean): void;
export declare function setAudioCategory(category: AudioCategory): void;
export { StatusEvent as ChangeEventPayload, AudioSource };
//# sourceMappingURL=index.d.ts.map