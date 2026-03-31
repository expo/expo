import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSFaceIDUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
     * @platform ios
     */
    faceIDPermission?: string | false;
    /**
     * Whether to configure automatic Android backup to work correctly with expo-secure-store.
     * @default true
     * @platform android
     */
    configureAndroidBackup?: boolean;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
