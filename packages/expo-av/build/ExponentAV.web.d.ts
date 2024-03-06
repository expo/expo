import { PermissionResponse } from 'expo-modules-core';
import type { AVPlaybackNativeSource, AVPlaybackStatus, AVPlaybackStatusToSet } from './AV.types';
import type { RecordingStatus } from './Audio/Recording.types';
declare const _default: {
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
    getPermissionsAsync(): Promise<PermissionResponse>;
    requestPermissionsAsync(): Promise<PermissionResponse>;
};
export default _default;
//# sourceMappingURL=ExponentAV.web.d.ts.map