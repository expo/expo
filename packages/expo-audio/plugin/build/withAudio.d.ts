import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSMicrophoneUsageDescription` permission message, or `false` to disable.
     * @default "Allow $(PRODUCT_NAME) to access your microphone"
     * @platform ios
     */
    microphonePermission?: string | false;
    /**
     * Whether to enable the `RECORD_AUDIO` permission on Android.
     * @default true
     * @platform android
     */
    recordAudioAndroid?: boolean;
    /**
     * Whether to enable background audio recording.
     * @default false
     */
    enableBackgroundRecording?: boolean;
    /**
     * Whether to enable background audio playback.
     * @default true
     */
    enableBackgroundPlayback?: boolean;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
