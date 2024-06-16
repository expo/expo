import { AndroidConfig, ConfigPlugin, IOSConfig, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-calendar/package.json');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

const withCalendar: ConfigPlugin<
  {
    calendarPermission?: string | false;
    remindersPermission?: string | false;
  } | void
> = (config, { calendarPermission, remindersPermission } = {}) => {
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
