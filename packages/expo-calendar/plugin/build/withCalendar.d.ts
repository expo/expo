import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSCalendarsUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your calendars"
     * @platform ios
     */
    calendarPermission?: string | false;
    /**
     * A string to set the `NSRemindersUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your reminders"
     * @platform ios
     */
    remindersPermission?: string | false;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
