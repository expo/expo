import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
export type WithMediaLibraryProps = {
    photosPermission?: string | false;
    savePhotosPermission?: string | false;
    isAccessMediaLocationEnabled?: boolean;
};
export declare function modifyAndroidManifest(manifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
declare const _default: ConfigPlugin<void | WithMediaLibraryProps>;
export default _default;
