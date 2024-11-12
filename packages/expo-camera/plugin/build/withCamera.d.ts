import { type ConfigPlugin } from 'expo/config-plugins';
export type WithCameraProps = {
    cameraPermission?: string | false;
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
};
declare const _default: ConfigPlugin<void | WithCameraProps>;
export default _default;
