import { type ConfigPlugin } from 'expo/config-plugins';
declare const _default: ConfigPlugin<void | {
    cameraPermission?: string | false;
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
    barcodeScannerEnabled?: boolean;
}>;
export default _default;
