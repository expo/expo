import { ConfigPlugin, withPlugins } from '@expo/config-plugins';

import {
  withIosModulesAppDelegate,
  withIosModulesAppDelegateObjcHeader,
  withIosModulesSwiftBridgingHeader,
} from './withIosModulesAppDelegate';
import { withIosModulesPodfile } from './withIosModulesPodfile';

export const withIosModules: ConfigPlugin = config => {
  return withPlugins(config, [
    withIosModulesAppDelegate,
    withIosModulesAppDelegateObjcHeader,
    withIosModulesSwiftBridgingHeader,
    withIosModulesPodfile,
  ]);
};
