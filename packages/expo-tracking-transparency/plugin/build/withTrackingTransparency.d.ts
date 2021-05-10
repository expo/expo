import { ConfigPlugin } from '@expo/config-plugins';
export declare const withUserTrackingPermission: ConfigPlugin<{
    userTrackingPermission?: string | false;
} | void>;
declare const _default: ConfigPlugin<void | {
    /**
     * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`.
     * Passing `false` will skip adding the permission.
     * @default 'Allow this app to collect app-related data that can be used for tracking you or your device.'
     */
    userTrackingPermission?: string | false | undefined;
}>;
export default _default;
