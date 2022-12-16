import { ExpoConfig } from '@expo/config-types';

import { createInfoPlistPluginWithPropertyGuard } from '../plugins/ios-plugins';
import { InfoPlist } from './IosConfig.types';

export const withVersion = createInfoPlistPluginWithPropertyGuard(
  setVersion,
  {
    infoPlistProperty: 'CFBundleShortVersionString',
    expoConfigProperty: 'version',
  },
  'withVersion'
);

export const withBuildNumber = createInfoPlistPluginWithPropertyGuard(
  setBuildNumber,
  {
    infoPlistProperty: 'CFBundleVersion',
    expoConfigProperty: 'ios.buildNumber',
  },
  'withBuildNumber'
);

export function getVersion(config: Pick<ExpoConfig, 'version'>) {
  return config.version || '1.0.0';
}

export function setVersion(config: Pick<ExpoConfig, 'version'>, infoPlist: InfoPlist): InfoPlist {
  return {
    ...infoPlist,
    CFBundleShortVersionString: getVersion(config),
  };
}

export function getBuildNumber(config: Pick<ExpoConfig, 'ios'>) {
  return config.ios?.buildNumber ? config.ios.buildNumber : '1';
}

export function setBuildNumber(config: Pick<ExpoConfig, 'ios'>, infoPlist: InfoPlist): InfoPlist {
  return {
    ...infoPlist,
    CFBundleVersion: getBuildNumber(config),
  };
}
