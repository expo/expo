import { ConfigPlugin } from 'expo/config-plugins';
export declare const DEFAULT_NSUserTrackingUsageDescription = "Allow this app to collect app-related data that can be used for tracking you or your device.";
export declare const withUserTrackingPermission: ConfigPlugin<{
    userTrackingPermission?: string;
} | void>;
declare const _default: ConfigPlugin<void | {
    /**
     * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`. Omitting a
     * description will result in using the default permission message.
     * @default 'Allow this app to collect app-related data that can be used for tracking you or your
     * device.'
     */
    userTrackingPermission?: string | undefined;
}>;
export default _default;
