import type { AudioStreamOptions, AudioStreamResult } from './AudioStream.types';
/**
 * Hook that creates a native audio stream for real-time PCM microphone capture.
 * Call `stream.start()` to begin and `stream.stop()` to end.
 * Requires microphone permission via `requestRecordingPermissionsAsync()`.
 */
export declare function useAudioStream(options?: AudioStreamOptions): AudioStreamResult;
//# sourceMappingURL=AudioStream.d.ts.map