import { PermissionResponse } from 'expo-modules-core';
import { AudioMode, AudioPlayerOptions, AudioSource, AudioStatus, RecorderState, RecordingOptions, RecordingStatus } from './Audio.types';
import AudioModule from './AudioModule';
import { AudioPlayer, AudioRecorder, AudioSample } from './AudioModule.types';
/**
 * Creates an `AudioPlayer` instance that automatically releases when the component unmounts.
 *
 * This hook manages the player's lifecycle and ensures it's properly disposed when no longer needed.
 * The player will start loading the audio source immediately upon creation.
 *
 * @param source The audio source to load. Can be a local asset via `require()`, a remote URL, or null for no initial source.
 * @param options Audio player configuration options.
 * @returns An `AudioPlayer` instance that's automatically managed by the component lifecycle.
 *
 * @example
 * ```tsx
 * import { useAudioPlayer } from 'expo-audio';
 *
 * function MyComponent() {
 *   const player = useAudioPlayer(require('./sound.mp3'));
 *
 *   return (
 *     <Button title="Play" onPress={() => player.play()} />
 *   );
 * }
 * ```
 *
 * @example Using downloadFirst
 * ```tsx
 * import { useAudioPlayer } from 'expo-audio';
 *
 * function MyComponent() {
 *   const player = useAudioPlayer('https://example.com/audio.mp3', {
 *     updateInterval: 1000,
 *     downloadFirst: true,
 *   });
 *
 *   return (
 *     <Button title="Play" onPress={() => player.play()} />
 *   );
 * }
 * ```
 */
export declare function useAudioPlayer(source?: AudioSource, options?: AudioPlayerOptions): AudioPlayer;
/**
 * Hook that provides real-time playback status updates for an `AudioPlayer`.
 *
 * This hook automatically subscribes to playback status changes and returns the current status.
 * The status includes information about playback state, current time, duration, loading state, and more.
 *
 * @param player The `AudioPlayer` instance to monitor.
 * @returns The current `AudioStatus` object containing playback information.
 *
 * @example
 * ```tsx
 * import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
 *
 * function PlayerComponent() {
 *   const player = useAudioPlayer(require('./sound.mp3'));
 *   const status = useAudioPlayerStatus(player);
 *
 *   return (
 *     <View>
 *       <Text>Playing: {status.isPlaying ? 'Yes' : 'No'}</Text>
 *       <Text>Current Time: {status.currentTime}s</Text>
 *       <Text>Duration: {status.duration}s</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export declare function useAudioPlayerStatus(player: AudioPlayer): AudioStatus;
/**
 * Hook that sets up audio sampling for an `AudioPlayer` and calls a listener with audio data.
 *
 * This hook enables audio sampling on the player (if supported) and subscribes to audio sample updates.
 * Audio sampling provides real-time access to audio waveform data for visualization or analysis.
 *
 * > **Note:** Audio sampling requires `RECORD_AUDIO` permission on Android and is not supported on all platforms.
 *
 * @param player The `AudioPlayer` instance to sample audio from.
 * @param listener Function called with each audio sample containing waveform data.
 *
 * @example
 * ```tsx
 * import { useAudioPlayer, useAudioSampleListener } from 'expo-audio';
 *
 * function AudioVisualizerComponent() {
 *   const player = useAudioPlayer(require('./music.mp3'));
 *
 *   useAudioSampleListener(player, (sample) => {
 *     // Use sample.channels array for audio visualization
 *     console.log('Audio sample:', sample.channels[0].frames);
 *   });
 *
 *   return <AudioWaveform player={player} />;
 * }
 * ```
 */
export declare function useAudioSampleListener(player: AudioPlayer, listener: (data: AudioSample) => void): void;
/**
 * Hook that creates an `AudioRecorder` instance for recording audio.
 *
 * This hook manages the recorder's lifecycle and ensures it's properly disposed when no longer needed.
 * The recorder is automatically prepared with the provided options and can be used to record audio.
 *
 * @param options Recording configuration options including format, quality, sample rate, etc.
 * @param statusListener Optional callback function that receives recording status updates.
 * @returns An `AudioRecorder` instance that's automatically managed by the component lifecycle.
 *
 * @example
 * ```tsx
 * import { useAudioRecorder, RecordingPresets } from 'expo-audio';
 *
 * function RecorderComponent() {
 *   const recorder = useAudioRecorder(
 *     RecordingPresets.HIGH_QUALITY,
 *     (status) => console.log('Recording status:', status)
 *   );
 *
 *   const startRecording = async () => {
 *     await recorder.prepareToRecordAsync();
 *     recorder.record();
 *   };
 *
 *   return (
 *     <Button title="Start Recording" onPress={startRecording} />
 *   );
 * }
 * ```
 */
export declare function useAudioRecorder(options: RecordingOptions, statusListener?: (status: RecordingStatus) => void): AudioRecorder;
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
 *       <Text>Duration: {state.currentTime}s</Text>
 *       <Text>Can Record: {state.canRecord ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export declare function useAudioRecorderState(recorder: AudioRecorder, interval?: number): RecorderState;
/**
 * Creates an instance of an `AudioPlayer` that doesn't release automatically.
 *
 * > **info** For most use cases you should use the [`useAudioPlayer`](#useaudioplayer) hook instead.
 * > See the [Using the `AudioPlayer` directly](#using-the-audioplayer-directly) section for more details.
 * @param source The audio source to load.
 * @param options Audio player configuration options.
 */
export declare function createAudioPlayer(source?: AudioSource | string | number | null, options?: AudioPlayerOptions): AudioPlayer;
/**
 * Enables or disables the audio subsystem globally.
 *
 * When set to `false`, this will pause all audio playback and prevent new audio from playing.
 * This is useful for implementing app-wide audio controls or responding to system events.
 *
 * @param active Whether audio should be active (`true`) or disabled (`false`).
 * @returns A Promise that resolves when the audio state has been updated.
 *
 * @example
 * ```tsx
 * import { setIsAudioActiveAsync } from 'expo-audio';
 *
 * // Disable all audio when app goes to background
 * const handleAppStateChange = async (nextAppState) => {
 *   if (nextAppState === 'background') {
 *     await setIsAudioActiveAsync(false);
 *   } else if (nextAppState === 'active') {
 *     await setIsAudioActiveAsync(true);
 *   }
 * };
 * ```
 */
export declare function setIsAudioActiveAsync(active: boolean): Promise<void>;
/**
 * Configures the global audio behavior and session settings.
 *
 * This function allows you to control how your app's audio interacts with other apps,
 * background playback behavior, audio routing, and interruption handling.
 *
 * @param mode Partial audio mode configuration object. Only specified properties will be updated.
 * @returns A Promise that resolves when the audio mode has been applied.
 *
 * @example
 * ```tsx
 * import { setAudioModeAsync } from 'expo-audio';
 *
 * // Configure audio for background playback
 * await setAudioModeAsync({
 *   playsInSilentMode: true,
 *   shouldPlayInBackground: true,
 *   interruptionModeAndroid: 'duckOthers',
 *   interruptionMode: 'mixWithOthers'
 * });
 *
 * // Configure audio for recording
 * await setAudioModeAsync({
 *   allowsRecording: true,
 *   playsInSilentMode: false
 * });
 * ```
 */
export declare function setAudioModeAsync(mode: Partial<AudioMode>): Promise<void>;
/**
 * Requests permission to record audio from the microphone.
 *
 * This function prompts the user for microphone access permission, which is required
 * for audio recording functionality. On iOS, this will show the system permission dialog.
 * On Android, this requests the `RECORD_AUDIO` permission.
 *
 * @returns A Promise that resolves to a `PermissionResponse` object containing the permission status.
 *
 * @example
 * ```tsx
 * import { requestRecordingPermissionsAsync } from 'expo-audio';
 *
 * const checkPermissions = async () => {
 *   const { status, granted } = await requestRecordingPermissionsAsync();
 *
 *   if (granted) {
 *     console.log('Recording permission granted');
 *   } else {
 *     console.log('Recording permission denied:', status);
 *   }
 * };
 * ```
 */
export declare function requestRecordingPermissionsAsync(): Promise<PermissionResponse>;
/**
 * Checks the current status of recording permissions without requesting them.
 *
 * This function returns the current permission status for microphone access
 * without triggering a permission request dialog. Use this to check permissions
 * before deciding whether to call `requestRecordingPermissionsAsync()`.
 *
 * @returns A Promise that resolves to a `PermissionResponse` object containing the current permission status.
 *
 * @example
 * ```tsx
 * import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
 *
 * const ensureRecordingPermissions = async () => {
 *   const { status } = await getRecordingPermissionsAsync();
 *
 *   if (status !== 'granted') {
 *     // Permission not granted, request it
 *     const { granted } = await requestRecordingPermissionsAsync();
 *     return granted;
 *   }
 *
 *   return true; // Already granted
 * };
 * ```
 */
export declare function getRecordingPermissionsAsync(): Promise<PermissionResponse>;
export { AudioModule };
//# sourceMappingURL=ExpoAudio.d.ts.map