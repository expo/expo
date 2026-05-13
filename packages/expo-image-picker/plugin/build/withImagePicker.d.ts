import { type ConfigPlugin } from 'expo/config-plugins';
type ImagePickerColors = {
    /** Hex color for the crop toolbar background. */
    cropToolbarColor?: string;
    /** Hex color for the crop toolbar icon. */
    cropToolbarIconColor?: string;
    /** Hex color for the crop toolbar action text. */
    cropToolbarActionTextColor?: string;
    /** Hex color for the crop toolbar back button icon. */
    cropBackButtonIconColor?: string;
    /** Hex color for the crop screen background. */
    cropBackgroundColor?: string;
};
export type Props = {
    /**
     * A string to set the `NSPhotoLibraryUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your photos"
     * @platform ios
     */
    photosPermission?: string | false;
    /**
     * A string to set the `NSCameraUsageDescription` permission message, or `false` to block the permission on Android.
     * @default "Allow $(PRODUCT_NAME) to access your camera"
     */
    cameraPermission?: string | false;
    /**
     * A string to set the `NSMicrophoneUsageDescription` permission message, or `false` to block the permission on Android.
     * @default "Allow $(PRODUCT_NAME) to access your microphone"
     */
    microphonePermission?: string | false;
    /**
     * Color properties for customizing the image picker crop UI in light mode.
     * @platform android
     */
    colors?: ImagePickerColors;
    dark?: {
        /**
         * An object containing color overrides for dark mode.
         * @platform android
         */
        colors?: ImagePickerColors;
    };
};
export declare const withAndroidImagePickerPermissions: ConfigPlugin<Props | void>;
declare const _default: ConfigPlugin<void | Props>;
export default _default;
