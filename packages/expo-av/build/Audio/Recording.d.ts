import { PermissionResponse, PermissionStatus, PermissionHookOptions, Subscription } from 'expo-modules-core';
import { AVPlaybackStatus, AVPlaybackStatusToSet } from '../AV';
import { RecordingOptions, RecordingStatus } from './Recording.types';
import { Sound } from './Sound';
export declare function getPermissionsAsync(): Promise<PermissionResponse>;
export declare function requestPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Check or request permissions to record audio.
 * This uses both `requestPermissionAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Audio.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
export declare class Recording {
    _subscription: Subscription | null;
    _canRecord: boolean;
    _isDoneRecording: boolean;
    _finalDurationMillis: number;
    _uri: string | null;
    _onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null;
    _progressUpdateTimeoutVariable: number | null;
    _progressUpdateIntervalMillis: number;
    _options: RecordingOptions | null;
    _cleanupForUnloadedRecorder: (finalStatus?: RecordingStatus | undefined) => Promise<RecordingStatus>;
    _pollingLoop: () => Promise<void>;
    _disablePolling(): void;
    _enablePollingIfNecessaryAndPossible(): void;
    _callOnRecordingStatusUpdateForNewStatus(status: RecordingStatus): void;
    _performOperationAndHandleStatusAsync(operation: () => Promise<RecordingStatus>): Promise<RecordingStatus>;
    static createAsync: (options?: RecordingOptions, onRecordingStatusUpdate?: ((status: RecordingStatus) => void) | null, progressUpdateIntervalMillis?: number | null) => Promise<{
        recording: Recording;
        status: RecordingStatus;
    }>;
    getStatusAsync: () => Promise<RecordingStatus>;
    setOnRecordingStatusUpdate(onRecordingStatusUpdate: ((status: RecordingStatus) => void) | null): void;
    setProgressUpdateInterval(progressUpdateIntervalMillis: number): void;
    prepareToRecordAsync(options?: RecordingOptions): Promise<RecordingStatus>;
    startAsync(): Promise<RecordingStatus>;
    pauseAsync(): Promise<RecordingStatus>;
    stopAndUnloadAsync(): Promise<RecordingStatus>;
    getURI(): string | null;
    /** @deprecated Use `createNewLoadedSoundAsync()` instead */
    createNewLoadedSound(initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null): Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
    createNewLoadedSoundAsync(initialStatus?: AVPlaybackStatusToSet, onPlaybackStatusUpdate?: ((status: AVPlaybackStatus) => void) | null): Promise<{
        sound: Sound;
        status: AVPlaybackStatus;
    }>;
}
export * from './RecordingConstants';
export { PermissionResponse, PermissionStatus, PermissionHookOptions, RecordingOptions, RecordingStatus, };
