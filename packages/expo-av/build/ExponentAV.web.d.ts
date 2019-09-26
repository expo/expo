import { PlaybackNativeSource, PlaybackStatus, PlaybackStatusToSet } from './AV';
declare const _default: {
    readonly name: string;
    getStatusForVideo(element: HTMLMediaElement): Promise<PlaybackStatus>;
    loadForVideo(element: HTMLMediaElement, nativeSource: PlaybackNativeSource, fullInitialStatus: PlaybackStatusToSet): Promise<PlaybackStatus>;
    unloadForVideo(element: HTMLMediaElement): Promise<PlaybackStatus>;
    setStatusForVideo(element: HTMLMediaElement, status: PlaybackStatusToSet): Promise<PlaybackStatus>;
    replayVideo(element: HTMLMediaElement, status: PlaybackStatusToSet): Promise<PlaybackStatus>;
    setAudioMode(): Promise<void>;
    setAudioIsEnabled(): Promise<void>;
    getStatusForSound(element: HTMLMediaElement): Promise<PlaybackStatus>;
    loadForSound(nativeSource: string | {
        [key: string]: any;
        uri: string;
    }, fullInitialStatus: PlaybackStatusToSet): Promise<[HTMLMediaElement, PlaybackStatus]>;
    unloadForSound(element: HTMLMediaElement): Promise<void>;
    setStatusForSound(element: HTMLMediaElement, status: PlaybackStatusToSet): Promise<PlaybackStatus>;
    replaySound(element: HTMLMediaElement, status: PlaybackStatusToSet): Promise<PlaybackStatus>;
    getAudioRecordingStatus(): Promise<void>;
    prepareAudioRecorder(): Promise<void>;
    startAudioRecording(): Promise<void>;
    pauseAudioRecording(): Promise<void>;
    stopAudioRecording(): Promise<void>;
    unloadAudioRecorder(): Promise<void>;
};
export default _default;
