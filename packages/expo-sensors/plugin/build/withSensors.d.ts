import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSMotionUsageDescription` permission message, or `false` to disable.
     * @default "Allow $(PRODUCT_NAME) to access your device motion"
     * @platform ios
     */
    motionPermission?: string | false;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
