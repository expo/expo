import { ConfigPlugin, AndroidConfig } from 'expo/config-plugins';
type GranularPermission = 'photo' | 'video' | 'audio';
export declare function modifyAndroidManifest(manifest: AndroidConfig.Manifest.AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
export type Props = {
    /**
     * A string to set the `NSPhotoLibraryUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your photos"
     * @platform ios
     */
    photosPermission?: string | false;
    /**
     * A string to set the `NSPhotoLibraryAddUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to save photos"
     * @platform ios
     */
    savePhotosPermission?: string | false;
    /**
     * Whether to request the `ACCESS_MEDIA_LOCATION` permission on Android.
     * @default false
     * @platform android
     */
    isAccessMediaLocationEnabled?: boolean;
    /**
     * Whether to prevent the automatic limited access alert when the user has limited photo library access.
     * @default false
     * @platform ios
     */
    preventAutomaticLimitedAccessAlert?: boolean;
    /**
     * Which media permissions (`READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`) to add to the Android manifest.
     * @default ["photo", "video", "audio"]
     * @platform android
     */
    granularPermissions?: GranularPermission[];
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
