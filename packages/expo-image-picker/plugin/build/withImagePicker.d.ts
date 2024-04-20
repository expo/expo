import { ConfigPlugin } from '@expo/config-plugins';
type Props = {
    photosPermission?: string | false;
    cameraPermission?: string | false;
    microphonePermission?: string | false;
};
export declare const withAndroidImagePickerPermissions: ConfigPlugin<Props | void>;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
