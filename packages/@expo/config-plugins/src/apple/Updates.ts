import { ExpoPlist } from './AppleConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { withExpoPlist } from '../plugins/apple-plugins';
import {
  ExpoConfigUpdates,
  getExpoUpdatesPackageVersion,
  getRuntimeVersionNullableAsync,
  getUpdatesCheckOnLaunch,
  getUpdatesCodeSigningCertificate,
  getUpdatesCodeSigningMetadata,
  getUpdatesRequestHeaders,
  getUpdatesEnabled,
  getUpdatesTimeout,
  getUpdateUrl,
} from '../utils/Updates';

export enum Config {
  ENABLED = 'EXUpdatesEnabled',
  CHECK_ON_LAUNCH = 'EXUpdatesCheckOnLaunch',
  LAUNCH_WAIT_MS = 'EXUpdatesLaunchWaitMs',
  RUNTIME_VERSION = 'EXUpdatesRuntimeVersion',
  UPDATE_URL = 'EXUpdatesURL',
  UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = 'EXUpdatesRequestHeaders',
  CODE_SIGNING_CERTIFICATE = 'EXUpdatesCodeSigningCertificate',
  CODE_SIGNING_METADATA = 'EXUpdatesCodeSigningMetadata',
}

// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/

export const withUpdates: (applePlatform: 'ios' | 'macos') => ConfigPlugin =
  (applePlatform: 'ios' | 'macos') => (config) => {
    return withExpoPlist(applePlatform)(config, async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const expoUpdatesPackageVersion = getExpoUpdatesPackageVersion(projectRoot);
      config.modResults = await setUpdatesConfigAsync(applePlatform)(
        projectRoot,
        config,
        config.modResults,
        expoUpdatesPackageVersion
      );
      return config;
    });
  };

export const setUpdatesConfigAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (
    projectRoot: string,
    config: ExpoConfigUpdates,
    expoPlist: ExpoPlist,
    expoUpdatesPackageVersion?: string | null
  ): Promise<ExpoPlist> => {
    const newExpoPlist = {
      ...expoPlist,
      [Config.ENABLED]: getUpdatesEnabled(config),
      [Config.CHECK_ON_LAUNCH]: getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion),
      [Config.LAUNCH_WAIT_MS]: getUpdatesTimeout(config),
    };

    const updateUrl = getUpdateUrl(config);
    if (updateUrl) {
      newExpoPlist[Config.UPDATE_URL] = updateUrl;
    } else {
      delete newExpoPlist[Config.UPDATE_URL];
    }

    const codeSigningCertificate = getUpdatesCodeSigningCertificate(projectRoot, config);
    if (codeSigningCertificate) {
      newExpoPlist[Config.CODE_SIGNING_CERTIFICATE] = codeSigningCertificate;
    } else {
      delete newExpoPlist[Config.CODE_SIGNING_CERTIFICATE];
    }

    const codeSigningMetadata = getUpdatesCodeSigningMetadata(config);
    if (codeSigningMetadata) {
      newExpoPlist[Config.CODE_SIGNING_METADATA] = codeSigningMetadata;
    } else {
      delete newExpoPlist[Config.CODE_SIGNING_METADATA];
    }

    const requestHeaders = getUpdatesRequestHeaders(config);
    if (requestHeaders) {
      newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY] = requestHeaders;
    } else {
      delete newExpoPlist[Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY];
    }

    return await setVersionsConfigAsync(applePlatform)(projectRoot, config, newExpoPlist);
  };

export const setVersionsConfigAsync =
  (applePlatform: 'ios' | 'macos') =>
  async (
    projectRoot: string,
    config: ExpoConfigUpdates,
    expoPlist: ExpoPlist
  ): Promise<ExpoPlist> => {
    const newExpoPlist = { ...expoPlist };

    const runtimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, applePlatform);
    if (!runtimeVersion && expoPlist[Config.RUNTIME_VERSION]) {
      throw new Error(
        'A runtime version is set in your Expo.plist, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove EXUpdatesRuntimeVersion from your Expo.plist.'
      );
    }

    if (runtimeVersion) {
      delete newExpoPlist['EXUpdatesSDKVersion'];
      newExpoPlist[Config.RUNTIME_VERSION] = runtimeVersion;
    } else {
      delete newExpoPlist['EXUpdatesSDKVersion'];
      delete newExpoPlist[Config.RUNTIME_VERSION];
    }

    return newExpoPlist;
  };
