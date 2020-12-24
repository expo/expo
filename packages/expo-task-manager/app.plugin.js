const { createRunOncePlugin } = require('@expo/config-plugins');

const withTaskManager = config => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  if (!config.ios.infoPlist.UIBackgroundModes) config.ios.infoPlist.UIBackgroundModes = [];

  config.ios.infoPlist.UIBackgroundModes = [
    ...(new Set(config.ios.infoPlist.UIBackgroundModes.concat(['location', 'fetch']))),
  ];

  return config;
};

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withTaskManager, pkg.name, pkg.version);
