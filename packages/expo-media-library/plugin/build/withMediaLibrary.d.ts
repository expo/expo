import { ConfigPlugin, AndroidConfig } from '@expo/config-plugins';
export declare function modifyAndroidManifest(manifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
declare const _default: ConfigPlugin<void | {
    photosPermission?: string | undefined;
    savePhotosPermission?: string | undefined;
}>;
export default _default;
