import { Subscription } from 'expo-modules-core';
import { AudioPlayer, ChangeEventPayload } from './AudioModule.types';
export declare function useAudioPlayer(source?: string | null): AudioPlayer;
export declare function addChangeListener(listener: (event: ChangeEventPayload) => void): Subscription;
export { ChangeEventPayload };
//# sourceMappingURL=index.d.ts.map