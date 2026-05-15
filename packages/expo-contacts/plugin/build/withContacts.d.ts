import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSContactsUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your contacts"
     * @platform ios
     */
    contactsPermission?: string;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
