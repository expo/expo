import {
  createRunOncePlugin,
  AndroidConfig,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins';

import { PluginConfigType, validateConfig } from './pluginConfig';

const pkg = require('expo-dev-launcher/package.json');

export default createRunOncePlugin<PluginConfigType>(
  (config, props) => {
    validateConfig(props || {});

    config = withInfoPlist(config, (config) => {
      config.modResults['DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE'] =
        props.ios?.tryToLaunchLastOpenedBundle;
      return config;
    });

    config = withAndroidManifest(config, (config) => {
      const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

      if (props.android?.tryToLaunchLastOpenedBundle) {
        AndroidConfig.Manifest.addMetaDataItemToMainApplication(
          mainApplication,
          'DEV_CLIENT_TRY_TO_LAUNCH_LAST_BUNDLE',
          props.android?.tryToLaunchLastOpenedBundle?.toString()
        );
      }
      return config;
    });

    return config;
  },
  pkg.name,
  pkg.version
);
