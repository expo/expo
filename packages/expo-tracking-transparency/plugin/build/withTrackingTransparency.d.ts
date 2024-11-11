import { ConfigPlugin } from 'expo/config-plugins';
export type WithTrackingTransparencyProps = {
    /**
     * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`. Omitting a
     * description will result in using the default permission message.
     * @default 'Allow this app to collect app-related data that can be used for tracking you or your
     * device.'
     */
    userTrackingPermission?: string | false;
};
declare const _default: ConfigPlugin<void | WithTrackingTransparencyProps>;
export default _default;
