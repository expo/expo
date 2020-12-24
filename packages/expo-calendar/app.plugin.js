const {
  createRunOncePlugin,
  withPlugins,
  AndroidConfig,
  IOSConfig,
} = require('@expo/config-plugins');

const withCalendar = (
  config,
  // Should be able to be used without any parameters for auto configuration via expo-cli.
  { calendarPermission = 'Allow $(PRODUCT_NAME) to access your calendar' } = {}
) => {
  return withPlugins(config, [
    [
      IOSConfig.Permissions.withPermissions,
      {
        NSCalendarsUsageDescription: calendarPermission || null,
      },
    ],
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'],
    ],
  ]);
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withCalendar, pkg.name, pkg.version);
