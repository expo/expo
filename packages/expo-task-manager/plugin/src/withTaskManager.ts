import { ConfigPlugin, createRunOncePlugin, withInfoPlist } from 'expo/config-plugins';

const pkg = require('expo-task-manager/package.json');

const withTaskManager: ConfigPlugin = (config) => {
  config = withInfoPlist(config, (config) => {
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('fetch')) {
      config.modResults.UIBackgroundModes.push('fetch');
    }
    return config;
  });

  return config;
};

export default createRunOncePlugin(withTaskManager, pkg.name, pkg.version);
