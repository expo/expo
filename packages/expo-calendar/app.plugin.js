const { createRunOncePlugin, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withCalendar = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { calendarPermission } = {}
) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSCalendarsUsageDescription =
    calendarPermission ||
    config.ios.infoPlist.NSCalendarsUsageDescription ||
    'Allow $(PRODUCT_NAME) to access your calendar';

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withCalendar, pkg.name, pkg.version);
