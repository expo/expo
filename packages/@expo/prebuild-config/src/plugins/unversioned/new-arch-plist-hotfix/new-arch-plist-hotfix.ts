import { ConfigPlugin, InfoPlist, withInfoPlist } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

// This is a temporary plugin to fix the plist hotfix for the new arch.
// Fixes: https://github.com/expo/expo/issues/39597
const withNewArchPlistHotfix: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    config.modResults = setNewArchPlistHotfixConfig(config, config.modResults);
    return config;
  });
};

function setNewArchPlistHotfixConfig(config: ExpoConfig, infoPlist: InfoPlist): InfoPlist {
  return {
    ...infoPlist,
    RCTNewArchEnabled: true,
  };
}

export default withNewArchPlistHotfix;
