import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const CALENDARS_WRITE_ONLY_USAGE = 'Allow $(PRODUCT_NAME) to add events to your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

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

const withCalendar: ConfigPlugin<Props | void> = (
  config,
  { calendarPermission, writeOnlyCalendarPermission, remindersPermission, writeOnlyAccess } = {}
) => {
  const defaultDescriptions = {
    NSCalendarsUsageDescription: CALENDARS_USAGE,
    NSRemindersUsageDescription: REMINDERS_USAGE,
    NSRemindersFullAccessUsageDescription: REMINDERS_USAGE,
    ...(writeOnlyAccess
      ? { NSCalendarsWriteOnlyAccessUsageDescription: CALENDARS_WRITE_ONLY_USAGE }
      : {
          NSCalendarsFullAccessUsageDescription: CALENDARS_USAGE,
        }),
  };

  const customDescriptions = {
    NSCalendarsUsageDescription: calendarPermission,
    NSRemindersUsageDescription: remindersPermission,
    NSRemindersFullAccessUsageDescription: remindersPermission,
    ...(writeOnlyAccess
      ? { NSCalendarsWriteOnlyAccessUsageDescription: writeOnlyCalendarPermission }
      : {
          NSCalendarsFullAccessUsageDescription: calendarPermission,
        }),
  };

  IOSConfig.Permissions.createPermissionsPlugin(defaultDescriptions)(config, customDescriptions);
  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
  ]);
};

export default createRunOncePlugin(withCalendar, pkg.name, pkg.version);
