import { ConfigPlugin } from 'expo/config-plugins';
type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, {
    folderName: string;
    scale: number;
}>;
export declare const ANDROID_RES_PATH = "android/app/src/main/res/";
export declare const dpiValues: dpiMap;
export declare const FOREGROUND_SERVICE_ICON = "location_foreground_service_icon";
export declare const FOREGROUND_SERVICE_ICON_RESOURCE = "@drawable/location_foreground_service_icon";
export declare const META_DATA_FOREGROUND_SERVICE_ICON = "expo.modules.location.foreground_service_icon";
export declare const withForegroundServiceIcon: ConfigPlugin<{
    icon: string | null;
}>;
/**
 * Applies foreground service icon configuration for expo-location
 */
export declare function setForegroundServiceIconAsync(projectRoot: string, icon: string | null): Promise<void>;
export type Props = {
    /**
     * A string to set the `NSLocationAlwaysAndWhenInUseUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to use your location"
     * @platform ios
     */
    locationAlwaysAndWhenInUsePermission?: string | false;
    /**
     * A string to set the `NSLocationAlwaysUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to use your location"
     * @platform ios
     */
    locationAlwaysPermission?: string | false;
    /**
     * A string to set the `NSLocationWhenInUseUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to use your location"
     * @platform ios
     */
    locationWhenInUsePermission?: string | false;
    /**
     * Whether to enable location in `UIBackgroundModes`.
     * @default false
     * @platform ios
     */
    isIosBackgroundLocationEnabled?: boolean;
    /**
     * Whether to enable the `ACCESS_BACKGROUND_LOCATION` permission.
     * @default false
     * @platform android
     */
    isAndroidBackgroundLocationEnabled?: boolean;
    /**
     * Whether to enable the `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` permissions.
     * @default false
     * @platform android
     */
    isAndroidForegroundServiceEnabled?: boolean;
    /**
     * Local path to an image for the foreground service icon. Should be a 96x96 all-white PNG with transparency.
     * @platform android
     */
    androidForegroundServiceIcon?: string;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
