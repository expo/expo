import { useEffect, useState } from 'react';
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
export function useAudioRecorderState(recorder, interval = 500) {
    const [state, setState] = useState(recorder.getStatus());
    useEffect(() => {
        const int = setInterval(() => {
            const newState = recorder.getStatus();
            setState((prevState) => {
                const meteringChanged = (prevState.metering === undefined) !== (newState.metering === undefined) ||
                    (prevState.metering !== undefined &&
                        newState.metering !== undefined &&
                        Math.abs(prevState.metering - newState.metering) > 0.1);
                if (prevState.canRecord !== newState.canRecord ||
                    prevState.isRecording !== newState.isRecording ||
                    prevState.mediaServicesDidReset !== newState.mediaServicesDidReset ||
                    prevState.url !== newState.url ||
                    Math.abs(prevState.durationMillis - newState.durationMillis) > 50 ||
                    meteringChanged) {
                    return newState;
                }
                return prevState;
            });
        }, interval);
        return () => clearInterval(int);
    }, [recorder.id]);
    return state;
}
//# sourceMappingURL=useAudioRecorderState.js.map