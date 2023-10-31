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

    if ((props.ios?.launchModeExperimental || props.launchModeExperimental) === 'most-recent') {
      config = withInfoPlist(config, (config) => {
        config.modResults['DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE'] = true;
        return config;
      });
    }

    if ((props.android?.launchModeExperimental || props.launchModeExperimental) === 'most-recent') {
      config = withAndroidManifest(config, (config) => {
        const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
          mainApplication,
          'DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE',
          true?.toString()
        );
        return config;
      });
    }

    return config;
  },
  pkg.name,
  pkg.version
);
