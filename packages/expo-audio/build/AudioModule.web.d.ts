import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioSource } from './Audio.types';
export { AudioPlayerWeb } from './AudioPlayer.web';
export { AudioPlaylistWeb } from './AudioPlaylist.web';
export { AudioRecorderWeb } from './AudioRecorder.web';
export declare let isAudioActive: boolean;
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function preloadAsync(source: AudioSource): Promise<void>;
export declare function preload(source: AudioSource): void;
export declare function clearPreloadedSource(source: AudioSource): void;
export declare function clearAllPreloadedSources(): void;
export declare function getPreloadedSources(): string[];
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
//# sourceMappingURL=AudioModule.web.d.ts.map