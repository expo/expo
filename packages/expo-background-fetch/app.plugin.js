const pkg = require('./package.json');
const { createRunOncePlugin, AndroidConfig } = require('@expo/config-plugins');

const withBackgroundFetch = config => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  if (!config.ios.infoPlist.UIBackgroundModes) config.ios.infoPlist.UIBackgroundModes = [];

  // TODO: Maybe entitlements are needed
  config.ios.infoPlist.UIBackgroundModes = [
    ...new Set(config.ios.infoPlist.UIBackgroundModes.concat(['location', 'fetch'])),
  ];

  config = AndroidConfig.Permissions.withPermissions(config, [
    'android.permission.RECEIVE_BOOT_COMPLETED',
    'android.permission.WAKE_LOCK',
  ]);

  return config;
};

module.exports = createRunOncePlugin(withBackgroundFetch, pkg.name, pkg.version);
