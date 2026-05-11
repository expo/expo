import { ConfigPlugin } from 'expo/config-plugins';
export type Props = {
    /**
     * A string to set the `NSCalendarsUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your calendars"
     * @platform ios
     */
    calendarPermission?: string | false;
    /**
     * A string to set the `NSCalendarsWriteOnlyAccessUsageDescription` permission message,
     * shown when requesting write-only calendar access (iOS 17+).
     * Only used when `writeOnlyAccess` is `true`.
     * @default "Allow $(PRODUCT_NAME) to add events to your calendars"
     * @platform ios
     */
    writeOnlyCalendarPermission?: string | false;
    /**
     * A string to set the `NSRemindersUsageDescription` permission message.
     * @default "Allow $(PRODUCT_NAME) to access your reminders"
     * @platform ios
     */
    remindersPermission?: string | false;
    /**
     * When `true`, requests write-only calendar access (iOS 17+). Sets
     * `NSCalendarsWriteOnlyAccessUsageDescription` and omits `NSCalendarsFullAccessUsageDescription`.
     * @default false
     * @platform ios
     */
    writeOnlyAccess?: boolean;
};
declare const _default: ConfigPlugin<void | Props>;
export default _default;
