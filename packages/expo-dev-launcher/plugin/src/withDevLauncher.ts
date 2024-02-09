import {
  createRunOncePlugin,
  AndroidConfig,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins';

import { PluginConfigType, validateConfig } from './pluginConfig';

const pkg = require('expo-dev-launcher/package.json');

export default createRunOncePlugin<PluginConfigType>(
  (config, props = {}) => {
    validateConfig(props);

    if ((props.ios?.launchModeExperimental || props.launchModeExperimental) === 'launcher') {
      config = withInfoPlist(config, (config) => {
        config.modResults['DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE'] = false;
        return config;
      });
    }

    if ((props.android?.launchModeExperimental || props.launchModeExperimental) === 'launcher') {
      config = withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
          mainApplication,
          'DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE',
          false?.toString()
        );
        return config;
      });
    }

    return config;
  },
  pkg.name,
  pkg.version
);
