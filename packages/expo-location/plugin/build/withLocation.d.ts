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
declare const _default: ConfigPlugin<void | {
    locationAlwaysAndWhenInUsePermission?: string | false;
    locationAlwaysPermission?: string | false;
    locationWhenInUsePermission?: string | false;
    isIosBackgroundLocationEnabled?: boolean;
    isAndroidBackgroundLocationEnabled?: boolean;
    isAndroidForegroundServiceEnabled?: boolean;
    androidForegroundServiceIcon?: string;
}>;
export default _default;
