import { AudioMode, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import { AudioPlayer, AudioRecorder } from './AudioModule.types';
import * as AudioModule from './AudioModule.web';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, updateInterval?: number): AudioModule.AudioPlayerWeb;
export declare function useAudioPlayerStatus(player: AudioModule.AudioPlayerWeb): AudioStatus;
export declare function useAudioSampleListener(player: AudioModule.AudioPlayerWeb, listener: (data: {
    channels: {
        frames: number[];
    }[];
    timestamp: number;
}) => void): void;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioModule.AudioRecorderWeb;
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: AudioMode): Promise<void>;
export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
export * from './RecordingConstants';
//# sourceMappingURL=ExpoAudio.web.d.ts.map