import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSFaceIDUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to use Face ID"
     * @platform ios
     */
    faceIDPermission?: string | false;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
