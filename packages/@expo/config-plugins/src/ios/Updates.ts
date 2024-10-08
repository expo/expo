import { ExpoPlist } from './IosConfig.types';
import { ConfigPlugin } from '../Plugin.types';
import { withExpoPlist } from '../plugins/ios-plugins';
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
  getUpdatesUseEmbeddedUpdate,
  getUpdateUrl,
} from '../utils/Updates';
import { addWarningIOS } from '../utils/warnings';

export enum Config {
  ENABLED = 'EXUpdatesEnabled',
  CHECK_ON_LAUNCH = 'EXUpdatesCheckOnLaunch',
  LAUNCH_WAIT_MS = 'EXUpdatesLaunchWaitMs',
  RUNTIME_VERSION = 'EXUpdatesRuntimeVersion',
  UPDATE_URL = 'EXUpdatesURL',
  UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = 'EXUpdatesRequestHeaders',
  UPDATES_HAS_EMBEDDED_UPDATE = 'EXUpdatesHasEmbeddedUpdate',
  CODE_SIGNING_CERTIFICATE = 'EXUpdatesCodeSigningCertificate',
  CODE_SIGNING_METADATA = 'EXUpdatesCodeSigningMetadata',
}

// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/

export const withUpdates: ConfigPlugin = (config) => {
  return withExpoPlist(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const expoUpdatesPackageVersion = getExpoUpdatesPackageVersion(projectRoot);
    config.modResults = await setUpdatesConfigAsync(
      projectRoot,
      config,
      config.modResults,
      expoUpdatesPackageVersion
    );
    return config;
  });
};

export async function setUpdatesConfigAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist,
  expoUpdatesPackageVersion?: string | null
): Promise<ExpoPlist> {
  const checkOnLaunch = getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion);
  const timeout = getUpdatesTimeout(config);
  const useEmbeddedUpdate = getUpdatesUseEmbeddedUpdate(config);

  // TODO: is there a better place for this validation?
  if (!useEmbeddedUpdate && timeout === 0 && checkOnLaunch !== 'ALWAYS') {
    addWarningIOS(
      'updates.useEmbeddedUpdate',
      `updates.checkOnLaunch should be set to "ON_LOAD" and updates.fallbackToCacheTimeout should be set to a non-zero value when updates.useEmbeddedUpdate is set to false. This is because an update must be fetched on the initial launch, when no embedded update is available.`
    );
  }

  const newExpoPlist = {
    ...expoPlist,
    [Config.ENABLED]: getUpdatesEnabled(config),
    [Config.CHECK_ON_LAUNCH]: checkOnLaunch,
    [Config.LAUNCH_WAIT_MS]: timeout,
  };

  // The native config name is "has embedded update", but we want to expose
  // this to the user as "use embedded update", since this is more accurate.
  // The field does not disable actually building and embedding the update,
  // only whether it is actually used.
  if (useEmbeddedUpdate) {
    delete newExpoPlist[Config.UPDATES_HAS_EMBEDDED_UPDATE];
  } else {
    newExpoPlist[Config.UPDATES_HAS_EMBEDDED_UPDATE] = false;
  }

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

  return await setVersionsConfigAsync(projectRoot, config, newExpoPlist);
}

export async function setVersionsConfigAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  expoPlist: ExpoPlist
): Promise<ExpoPlist> {
  const newExpoPlist = { ...expoPlist };

  const runtimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, 'ios');
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
}
