import { ExpoConfig } from '@expo/config-types';

import { InfoPlist } from './IosConfig.types';
import { createInfoPlistPluginWithPropertyGuard } from '../plugins/ios-plugins';

export const withVersion = createInfoPlistPluginWithPropertyGuard(
  setVersion,
  {
    infoPlistProperty: 'CFBundleShortVersionString',
    expoConfigProperty: 'version | ios.version',
    expoPropertyGetter: getVersion,
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

export function getVersion(config: Pick<ExpoConfig, 'version' | 'ios'>) {
  return config.ios?.version || config.version || '1.0.0';
}

export function setVersion(
  config: Pick<ExpoConfig, 'version' | 'ios'>,
  infoPlist: InfoPlist
): InfoPlist {
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
