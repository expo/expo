import { PermissionResponse } from 'expo-modules-core';
import { AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV';
import { RecordingStatus } from './Audio/Recording';
/**
 * Gets the permission details. The implementation is not very good as it actually requests
 * access to the microhpone, not all browsers support the experimental permissions api
 */
declare function getPermissionsAsync(): Promise<PermissionResponse>;
declare const _default: {
    readonly name: string;
    getStatusForVideo(element: HTMLMediaElement): Promise<AVPlaybackStatus>;
    loadForVideo(element: HTMLMediaElement, nativeSource: AVPlaybackNativeSource, fullInitialStatus: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    unloadForVideo(element: HTMLMediaElement): Promise<AVPlaybackStatus>;
    setStatusForVideo(element: HTMLMediaElement, status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    replayVideo(element: HTMLMediaElement, status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    setAudioMode(): Promise<void>;
    setAudioIsEnabled(): Promise<void>;
    getStatusForSound(element: HTMLMediaElement): Promise<AVPlaybackStatus>;
    loadForSound(nativeSource: string | {
        [key: string]: any;
        uri: string;
    }, fullInitialStatus: AVPlaybackStatusToSet): Promise<[HTMLMediaElement, AVPlaybackStatus]>;
    unloadForSound(element: HTMLMediaElement): Promise<AVPlaybackStatus>;
    setStatusForSound(element: HTMLMediaElement, status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    replaySound(element: HTMLMediaElement, status: AVPlaybackStatusToSet): Promise<AVPlaybackStatus>;
    getAudioRecordingStatus(): Promise<RecordingStatus>;
    prepareAudioRecorder(options: any): Promise<{
        uri: string | null;
        status: Pick<RecordingStatus, Exclude<keyof RecordingStatus, 'canRecord'>>;
    }>;
    startAudioRecording(): Promise<RecordingStatus>;
    pauseAudioRecording(): Promise<RecordingStatus>;
    stopAudioRecording(): Promise<RecordingStatus>;
    unloadAudioRecorder(): Promise<void>;
    getPermissionsAsync: typeof getPermissionsAsync;
    requestPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
