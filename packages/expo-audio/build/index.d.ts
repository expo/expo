import { Subscription } from 'expo-modules-core';
import { AudioSource } from './Audio.types';
import { AudioPlayer, StatusEvent } from './AudioModule.types';
export declare function useAudioPlayer(source?: AudioSource | string | number | null): AudioPlayer;
export declare function addStatusUpdateListener(listener: (event: StatusEvent) => void): Subscription;
export declare function setIsAudioActive(enabled: boolean): void;
export { StatusEvent as ChangeEventPayload, AudioSource };
//# sourceMappingURL=index.d.ts.map