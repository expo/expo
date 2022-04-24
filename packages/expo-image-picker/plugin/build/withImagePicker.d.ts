import { ConfigPlugin, InfoPlist } from '@expo/config-plugins';
declare type Props = {
    photosPermission?: string | false;
    cameraPermission?: string | false;
    microphonePermission?: string | false;
};
export declare function setImagePickerInfoPlist(infoPlist: InfoPlist, { cameraPermission, microphonePermission, photosPermission }: Props): InfoPlist;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
