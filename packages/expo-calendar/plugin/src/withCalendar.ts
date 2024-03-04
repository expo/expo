import { AndroidConfig, ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-calendar/package.json');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

const withCalendar: ConfigPlugin<
  {
    calendarPermission?: string;
    remindersPermission?: string;
  } | void
> = (config, { calendarPermission, remindersPermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};

  config.ios.infoPlist.NSCalendarsUsageDescription =
    calendarPermission || config.ios.infoPlist.NSCalendarsUsageDescription || CALENDARS_USAGE;
  config.ios.infoPlist.NSRemindersUsageDescription =
    remindersPermission || config.ios.infoPlist.NSRemindersUsageDescription || REMINDERS_USAGE;

  config.ios.infoPlist.NSCalendarsFullAccessUsageDescription =
    calendarPermission ||
    config.ios.infoPlist.NSCalendarsFullAccessUsageDescription ||
    CALENDARS_USAGE;
  config.ios.infoPlist.NSRemindersFullAccessUsageDescription =
    remindersPermission ||
    config.ios.infoPlist.NSRemindersFullAccessUsageDescription ||
    REMINDERS_USAGE;

  config.ios.infoPlist.NSCalendarsFullAccessUsageDescription =
    calendarPermission ||
    config.ios.infoPlist.NSCalendarsFullAccessUsageDescription ||
    CALENDARS_USAGE;
  config.ios.infoPlist.NSRemindersFullAccessUsageDescription =
    remindersPermission ||
    config.ios.infoPlist.NSRemindersFullAccessUsageDescription ||
    REMINDERS_USAGE;

  return AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.READ_CALENDAR',
    'android.permission.WRITE_CALENDAR',
  ]);
};

export default createRunOncePlugin(withCalendar, pkg.name, pkg.version);
