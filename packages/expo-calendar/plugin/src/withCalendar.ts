import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-calendar/package.json');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

const withCalendar: ConfigPlugin<
  {
    calendarPermission?: string;
    remindersPermission?: string;
  } | void
> = (config, { calendarPermission, remindersPermission } = {}) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSCalendarsUsageDescription =
      calendarPermission || config.modResults.NSCalendarsUsageDescription || CALENDARS_USAGE;
    config.modResults.NSRemindersUsageDescription =
      remindersPermission || config.modResults.NSRemindersUsageDescription || REMINDERS_USAGE;

    config.modResults.NSCalendarsFullAccessUsageDescription =
      calendarPermission ||
      config.modResults.NSCalendarsFullAccessUsageDescription ||
      CALENDARS_USAGE;
    config.modResults.NSRemindersFullAccessUsageDescription =
      remindersPermission ||
      config.modResults.NSRemindersFullAccessUsageDescription ||
      REMINDERS_USAGE;

    return config;
  });

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
  ]);
};

export default createRunOncePlugin(withCalendar, pkg.name, pkg.version);
