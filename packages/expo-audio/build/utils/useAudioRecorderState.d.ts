import type { RecorderState } from '../Audio.types';
import type { AudioRecorder } from '../AudioModule.types';
/**
 * Hook that provides real-time recording state updates for an `AudioRecorder`.
 *
 * This hook polls the recorder's status at regular intervals and returns the current recording state.
 * Use this when you need to monitor the recording status without setting up a status listener.
 *
 * @param recorder The `AudioRecorder` instance to monitor.
 * @param interval How often (in milliseconds) to poll the recorder's status. Defaults to 500ms.
 * @returns The current `RecorderState` containing recording information.
 *
 * @example
 * ```tsx
 * import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';
 *
 * function RecorderStatusComponent() {
 *   const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
 *   const state = useAudioRecorderState(recorder);
 *
 *   return (
 *     <View>
 *       <Text>Recording: {state.isRecording ? 'Yes' : 'No'}</Text>
 *       <Text>Duration: {Math.round(state.durationMillis / 1000)}s</Text>
 *       <Text>Can Record: {state.canRecord ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
//# sourceMappingURL=useAudioRecorderState.d.ts.map