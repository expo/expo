import { ConfigPlugin, createRunOncePlugin, withInfoPlist } from 'expo/config-plugins';

const pkg = require('expo-background-task/package.json');

const withBackgroundTask: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    // Enable background mode processing
    if (!Array.isArray(config.modResults.UIBackgroundModes)) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('processing')) {
      config.modResults.UIBackgroundModes.push('processing');
    }

    // With the new background task module we need to install the identifier in the Info.plist:
    // BGTaskSchedulerPermittedIdentifiers should be an array of strings - we need to
    // define our own identifier: com.expo.modules.backgroundtask.taskidentifer
    if (!Array.isArray(config.modResults.BGTaskSchedulerPermittedIdentifiers)) {
      config.modResults.BGTaskSchedulerPermittedIdentifiers = [];
    }
    if (
      !(config.modResults.BGTaskSchedulerPermittedIdentifiers as string[]).includes(
        'com.expo.modules.backgroundtask.processing'
      )
    ) {
      config.modResults.BGTaskSchedulerPermittedIdentifiers = [
        ...((config.modResults.BGTaskSchedulerPermittedIdentifiers as string[]) || []),
        'com.expo.modules.backgroundtask.processing',
      ];
    }

    return config;
  });
};

export default createRunOncePlugin(withBackgroundTask, pkg.name, pkg.version);
