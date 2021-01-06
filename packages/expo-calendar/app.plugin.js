const pkg = require('./package.json');
const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const CALENDARS_USAGE = 'Allow $(PRODUCT_NAME) to access your calendars';
const REMINDERS_USAGE = 'Allow $(PRODUCT_NAME) to access your reminders';

const withCalendar = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { calendarPermission, remindersPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSCalendarsUsageDescription =
    calendarPermission || config.ios.infoPlist.NSCalendarsUsageDescription || CALENDARS_USAGE;
  config.ios.infoPlist.NSRemindersUsageDescription =
    remindersPermission || config.ios.infoPlist.NSRemindersUsageDescription || REMINDERS_USAGE;

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'],
    ],
  ]);
};

module.exports = createRunOncePlugin(withCalendar, pkg.name, pkg.version);
