import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * Sets the iOS `NSUserTrackingUsageDescription` permission message in `Info.plist`. Omitting a
     * description will result in using the default permission message.
     * @default 'Allow this app to collect app-related data that can be used for tracking you or your
     * device.'
     * @platform ios
     */
    userTrackingPermission?: string | false;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
