import { AndroidConfig, ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
type AndroidManifest = AndroidConfig.Manifest.AndroidManifest;
export declare const META_DATA_NOTIFICATION_ICON = "expo.modules.notifications.default_notification_icon";
export declare const META_DATA_NOTIFICATION_ICON_COLOR = "expo.modules.notifications.default_notification_color";
export declare const NOTIFICATION_ICON = "notification_icon";
export declare const NOTIFICATION_ICON_RESOURCE = "@drawable/notification_icon";
export declare const NOTIFICATION_ICON_COLOR = "notification_icon_color";
export declare const NOTIFICATION_ICON_COLOR_RESOURCE = "@color/notification_icon_color";
export declare const withNotificationIcons: ConfigPlugin;
export declare const withNotificationIconColor: ConfigPlugin;
export declare const withNotificationManifest: ConfigPlugin;
export declare function getNotificationIcon(config: ExpoConfig): string | null;
export declare function getNotificationColor(config: ExpoConfig): string | null;
/**
 * Applies configuration for expo-notifications, including
 * the notification icon and notification color.
 */
export declare function setNotificationIconAsync(config: ExpoConfig, projectRoot: string): Promise<void>;
export declare function setNotificationConfig(config: ExpoConfig, manifest: AndroidManifest): AndroidConfig.Manifest.AndroidManifest;
export declare function setNotificationIconColor(config: ExpoConfig, colors: AndroidConfig.Resources.ResourceXML): AndroidConfig.Resources.ResourceXML;
export {};
