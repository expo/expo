import { PermissionResponse } from 'expo-modules-core';
import { AudioMode } from './Audio.types';
export { AudioPlayerWeb } from './AudioPlayer.web';
export { AudioRecorderWeb } from './AudioRecorder.web';
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
//# sourceMappingURL=AudioModule.web.d.ts.map