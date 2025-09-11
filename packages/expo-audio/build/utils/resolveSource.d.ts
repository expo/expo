import { AudioSource } from '../Audio.types';
export declare function resolveSource(source?: AudioSource | string | number | null): AudioSource | null;
/**
 * Resolves and optionally downloads an audio source before loading.
 * Similar to expo-av's getNativeSourceAndFullInitialStatusForLoadAsync but simplified for expo-audio.
 */
export declare function resolveSourceWithDownload(source: AudioSource | string | number | null): Promise<AudioSource | null>;
//# sourceMappingURL=resolveSource.d.ts.map