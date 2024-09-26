import { ExpoConfig } from 'expo/config';
import { AndroidConfig, ConfigPlugin } from 'expo/config-plugins';
import { NotificationsPluginProps } from './withNotifications';
type DPIString = 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
type dpiMap = Record<DPIString, {
    folderName: string;
    scale: number;
}>;
export declare const ANDROID_RES_PATH = "android/app/src/main/res/";
export declare const dpiValues: dpiMap;
export declare const META_DATA_FCM_NOTIFICATION_ICON = "com.google.firebase.messaging.default_notification_icon";
export declare const META_DATA_FCM_NOTIFICATION_ICON_COLOR = "com.google.firebase.messaging.default_notification_color";
export declare const META_DATA_FCM_NOTIFICATION_DEFAULT_CHANNEL_ID = "com.google.firebase.messaging.default_notification_channel_id";
export declare const META_DATA_LOCAL_NOTIFICATION_ICON = "expo.modules.notifications.default_notification_icon";
export declare const META_DATA_LOCAL_NOTIFICATION_ICON_COLOR = "expo.modules.notifications.default_notification_color";
export declare const NOTIFICATION_ICON = "notification_icon";
export declare const NOTIFICATION_ICON_RESOURCE: string;
export declare const NOTIFICATION_ICON_COLOR = "notification_icon_color";
export declare const NOTIFICATION_ICON_COLOR_RESOURCE: string;
export declare const withNotificationIcons: ConfigPlugin<{
    icon: string | null;
}>;
export declare const withNotificationIconColor: ConfigPlugin<{
    color: string | null;
}>;
export declare const withNotificationManifest: ConfigPlugin<{
    icon: string | null;
    color: string | null;
    defaultChannel: string | null;
}>;
export declare const withNotificationSounds: ConfigPlugin<{
    sounds: string[];
}>;
export declare function getNotificationIcon(config: ExpoConfig): string | null;
export declare function getNotificationColor(config: ExpoConfig): string | null;
export declare function setNotificationIconColor(color: string | null, colors: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
/**
 * Applies notification icon configuration for expo-notifications
 */
export declare function setNotificationIconAsync(projectRoot: string, icon: string | null): Promise<void>;
/**
 * Save sound files to `<project-root>/android/app/src/main/res/raw`
 */
export declare function setNotificationSounds(projectRoot: string, sounds: string[]): void;
export declare const withNotificationsAndroid: ConfigPlugin<NotificationsPluginProps>;
export {};
