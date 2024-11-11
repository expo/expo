import {
  addMetaDataItemToMainApplication,
  AndroidManifest,
  findMetaDataItem,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} from './Manifest';
import { buildResourceItem, ResourceXML } from './Resources';
import * as Resources from './Resources';
import { removeStringItem, setStringItem } from './Strings';
import { ConfigPlugin, ExportedConfigWithProps } from '../Plugin.types';
import { createStringsXmlPlugin, withAndroidManifest } from '../plugins/android-plugins';
import { withPlugins } from '../plugins/withPlugins';
import {
  ExpoConfigUpdates,
  getExpoUpdatesPackageVersion,
  getRuntimeVersionNullableAsync,
  getUpdatesCheckOnLaunch,
  getUpdatesCodeSigningCertificate,
  getUpdatesCodeSigningMetadataStringified,
  getUpdatesRequestHeadersStringified,
  getUpdatesEnabled,
  getUpdatesTimeout,
  getUpdateUrl,
  getUpdatesUseEmbeddedUpdate,
} from '../utils/Updates';
import { addWarningAndroid } from '../utils/warnings';

export enum Config {
  ENABLED = 'expo.modules.updates.ENABLED',
  CHECK_ON_LAUNCH = 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH',
  LAUNCH_WAIT_MS = 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS',
  RUNTIME_VERSION = 'expo.modules.updates.EXPO_RUNTIME_VERSION',
  UPDATE_URL = 'expo.modules.updates.EXPO_UPDATE_URL',
  UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = 'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY',
  UPDATES_HAS_EMBEDDED_UPDATE = 'expo.modules.updates.HAS_EMBEDDED_UPDATE',
  CODE_SIGNING_CERTIFICATE = 'expo.modules.updates.CODE_SIGNING_CERTIFICATE',
  CODE_SIGNING_METADATA = 'expo.modules.updates.CODE_SIGNING_METADATA',
}

// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
// Also ensure the docs are up-to-date: https://docs.expo.dev/bare/installing-updates/

export const withUpdates: ConfigPlugin = (config) => {
  return withPlugins(config, [withUpdatesManifest, withRuntimeVersionResource]);
};

const withUpdatesManifest: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
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

const withRuntimeVersionResource = createStringsXmlPlugin(
  applyRuntimeVersionFromConfigAsync,
  'withRuntimeVersionResource'
);

export async function applyRuntimeVersionFromConfigAsync(
  config: ExportedConfigWithProps<Resources.ResourceXML>,
  stringsJSON: ResourceXML
): Promise<ResourceXML> {
  const projectRoot = config.modRequest.projectRoot;
  return await applyRuntimeVersionFromConfigForProjectRootAsync(projectRoot, config, stringsJSON);
}

export async function applyRuntimeVersionFromConfigForProjectRootAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  stringsJSON: ResourceXML
): Promise<ResourceXML> {
  const runtimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, 'android');
  if (runtimeVersion) {
    return setStringItem(
      [buildResourceItem({ name: 'expo_runtime_version', value: runtimeVersion })],
      stringsJSON
    );
  }
  return removeStringItem('expo_runtime_version', stringsJSON);
}

export async function setUpdatesConfigAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  androidManifest: AndroidManifest,
  expoUpdatesPackageVersion?: string | null
): Promise<AndroidManifest> {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  addMetaDataItemToMainApplication(
    mainApplication,
    Config.ENABLED,
    String(getUpdatesEnabled(config))
  );
  const checkOnLaunch = getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion);
  addMetaDataItemToMainApplication(mainApplication, Config.CHECK_ON_LAUNCH, checkOnLaunch);

  const timeout = getUpdatesTimeout(config);
  addMetaDataItemToMainApplication(mainApplication, Config.LAUNCH_WAIT_MS, String(timeout));

  const useEmbeddedUpdate = getUpdatesUseEmbeddedUpdate(config);
  if (useEmbeddedUpdate) {
    removeMetaDataItemFromMainApplication(mainApplication, Config.UPDATES_HAS_EMBEDDED_UPDATE);
  } else {
    // TODO: is there a better place for this validation?
    if (timeout === 0 && checkOnLaunch !== 'ALWAYS') {
      addWarningAndroid(
        'updates.useEmbeddedUpdate',
        `updates.checkOnLaunch should be set to "ON_LOAD" and updates.fallbackToCacheTimeout should be set to a non-zero value when updates.useEmbeddedUpdate is set to false. This is because an update must be fetched on the initial launch, when no embedded update is available.`
      );
    }
    addMetaDataItemToMainApplication(mainApplication, Config.UPDATES_HAS_EMBEDDED_UPDATE, 'false');
  }

  const updateUrl = getUpdateUrl(config);
  if (updateUrl) {
    addMetaDataItemToMainApplication(mainApplication, Config.UPDATE_URL, updateUrl);
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.UPDATE_URL);
  }

  const codeSigningCertificate = getUpdatesCodeSigningCertificate(projectRoot, config);
  if (codeSigningCertificate) {
    addMetaDataItemToMainApplication(
      mainApplication,
      Config.CODE_SIGNING_CERTIFICATE,
      codeSigningCertificate
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.CODE_SIGNING_CERTIFICATE);
  }

  const codeSigningMetadata = getUpdatesCodeSigningMetadataStringified(config);
  if (codeSigningMetadata) {
    addMetaDataItemToMainApplication(
      mainApplication,
      Config.CODE_SIGNING_METADATA,
      codeSigningMetadata
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.CODE_SIGNING_METADATA);
  }

  const requestHeaders = getUpdatesRequestHeadersStringified(config);
  if (requestHeaders) {
    addMetaDataItemToMainApplication(
      mainApplication,
      Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY,
      requestHeaders
    );
  } else {
    removeMetaDataItemFromMainApplication(
      mainApplication,
      Config.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY
    );
  }

  return await setVersionsConfigAsync(projectRoot, config, androidManifest);
}

export async function setVersionsConfigAsync(
  projectRoot: string,
  config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>,
  androidManifest: AndroidManifest
): Promise<AndroidManifest> {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  const runtimeVersion = await getRuntimeVersionNullableAsync(projectRoot, config, 'android');
  if (!runtimeVersion && findMetaDataItem(mainApplication, Config.RUNTIME_VERSION) > -1) {
    throw new Error(
      'A runtime version is set in your AndroidManifest.xml, but is missing from your app.json/app.config.js. Please either set runtimeVersion in your app.json/app.config.js or remove expo.modules.updates.EXPO_RUNTIME_VERSION from your AndroidManifest.xml.'
    );
  }
  if (runtimeVersion) {
    removeMetaDataItemFromMainApplication(mainApplication, 'expo.modules.updates.EXPO_SDK_VERSION');
    addMetaDataItemToMainApplication(
      mainApplication,
      Config.RUNTIME_VERSION,
      '@string/expo_runtime_version'
    );
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.RUNTIME_VERSION);
    removeMetaDataItemFromMainApplication(mainApplication, 'expo.modules.updates.EXPO_SDK_VERSION');
  }

  return androidManifest;
}
