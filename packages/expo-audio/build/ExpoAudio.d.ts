import { AudioMode, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioMetadata, AudioPlayer, AudioRecorder } from './AudioModule.types';
export declare function useAudioPlayer(source?: AudioSource | string | number | null, updateInterval?: number, enableLockScreenControls?: boolean, metadata?: AudioMetadata): AudioPlayer;
export declare function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
export declare function useAudioSampleListener(player: AudioPlayer, listener: (data: {
    channels: {
        frames: number[];
    }[];
    timestamp: number;
}) => void): void;
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioRecorder;
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
export declare function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void>;
export { AudioModule, AudioPlayer, AudioRecorder };
export * from './Audio.types';
export * from './RecordingConstants';
//# sourceMappingURL=ExpoAudio.d.ts.map