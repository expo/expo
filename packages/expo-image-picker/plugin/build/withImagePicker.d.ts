import { ConfigPlugin, AndroidConfig, InfoPlist } from '@expo/config-plugins';
declare type Props = {
    photosPermission?: string | false;
    cameraPermission?: string | false;
    microphonePermission?: string | false;
};
export declare function setImagePickerManifestActivity(androidManifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
export declare function setImagePickerInfoPlist(infoPlist: InfoPlist, { cameraPermission, microphonePermission, photosPermission }: Props): InfoPlist;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
