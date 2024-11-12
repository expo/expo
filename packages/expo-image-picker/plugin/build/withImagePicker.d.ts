import { type ConfigPlugin } from 'expo/config-plugins';
export type WithImagePickerProps = {
    photosPermission?: string | false;
    cameraPermission?: string | false;
    microphonePermission?: string | false;
};
export declare const withAndroidImagePickerPermissions: ConfigPlugin<WithImagePickerProps | void>;
declare const _default: ConfigPlugin<void | WithImagePickerProps>;
export default _default;
