import { type ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSCameraUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your camera"
     * @platform ios
     */
    cameraPermission?: string | false;
    /**
     * A string to set the `NSMicrophoneUsageDescription` permission message.
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
     * Whether to enable barcode scanning support. Disabling this reduces app size.
     * @default true
     */
    barcodeScannerEnabled?: boolean;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
