import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('../../package.json');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

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

const withCalendar: ConfigPlugin<Props | void> = (
  config,
  { calendarPermission, remindersPermission } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSCalendarsUsageDescription: CALENDARS_USAGE,
    NSRemindersUsageDescription: REMINDERS_USAGE,
    NSCalendarsFullAccessUsageDescription: CALENDARS_USAGE,
    NSRemindersFullAccessUsageDescription: REMINDERS_USAGE,
  })(config, {
    NSCalendarsUsageDescription: calendarPermission,
    NSRemindersUsageDescription: remindersPermission,
    NSCalendarsFullAccessUsageDescription: calendarPermission,
    NSRemindersFullAccessUsageDescription: remindersPermission,
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
  ]);
};

export default createRunOncePlugin(withCalendar, pkg.name, pkg.version);
