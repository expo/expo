import type { ConfigPlugin } from '@expo/config-plugins';
import { withPlugins } from '@expo/config-plugins';
import semver from 'semver';

import {
  withIosModulesAppDelegate,
  withIosModulesAppDelegateObjcHeader,
  withIosModulesSwiftBridgingHeader,
} from './withIosModulesAppDelegate';
import { withIosModulesPodfile } from './withIosModulesPodfile';
import { withIosSceneDelegate } from './withIosSceneDelegate';

export const withIosModules: ConfigPlugin = (config) => {
  config = withPlugins(config, [
    withIosModulesAppDelegate,
    withIosModulesAppDelegateObjcHeader,
    withIosModulesSwiftBridgingHeader,
    withIosModulesPodfile,
  ]);
  if (config.sdkVersion && semver.gte(config.sdkVersion, '58.0.0')) {
    config = withIosSceneDelegate(config);
  }
  return config;
};
