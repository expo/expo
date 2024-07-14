import { ExpoConfig } from '@expo/config-types';

import { InfoPlist } from './AppleConfig.types';
import { createInfoPlistPluginWithPropertyGuard } from '../plugins/apple-plugins';

export const withVersion = (applePlatform: 'ios' | 'macos') =>
  createInfoPlistPluginWithPropertyGuard(applePlatform)(
    setVersion,
    {
      infoPlistProperty: 'CFBundleShortVersionString',
      expoConfigProperty: 'version',
    },
    'withVersion'
  );

export const withBuildNumber = (applePlatform: 'ios' | 'macos') =>
  createInfoPlistPluginWithPropertyGuard(applePlatform)(
    (config: Pick<ExpoConfig, typeof applePlatform>, infoPlist: InfoPlist) =>
      setBuildNumber(applePlatform)(config, infoPlist),
    {
      infoPlistProperty: 'CFBundleVersion',
      expoConfigProperty: `${applePlatform}.buildNumber`,
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

export const getBuildNumber =
  (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, typeof applePlatform>) =>
    config[applePlatform]?.buildNumber ? config[applePlatform]!.buildNumber : '1';

export const setBuildNumber =
  (applePlatform: 'ios' | 'macos') =>
  (config: Pick<ExpoConfig, typeof applePlatform>, infoPlist: InfoPlist): InfoPlist => {
    return {
      ...infoPlist,
      CFBundleVersion: getBuildNumber(applePlatform)(config),
    };
  };
