import path from 'path';
import resolveFrom from 'resolve-from';

import { Resources } from '.';
import {
  addMetaDataItemToMainApplication,
  AndroidManifest,
  findMetaDataItem,
  getMainApplicationMetaDataValue,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} from './Manifest';
import { buildResourceItem, ResourceXML } from './Resources';
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
} from '../utils/Updates';

const CREATE_MANIFEST_ANDROID_PATH = 'expo-updates/scripts/create-manifest-android.gradle';

export enum Config {
  ENABLED = 'expo.modules.updates.ENABLED',
  CHECK_ON_LAUNCH = 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH',
  LAUNCH_WAIT_MS = 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS',
  RUNTIME_VERSION = 'expo.modules.updates.EXPO_RUNTIME_VERSION',
  UPDATE_URL = 'expo.modules.updates.EXPO_UPDATE_URL',
  RELEASE_CHANNEL = 'expo.modules.updates.EXPO_RELEASE_CHANNEL',
  UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = 'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY',
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
  addMetaDataItemToMainApplication(
    mainApplication,
    Config.CHECK_ON_LAUNCH,
    getUpdatesCheckOnLaunch(config, expoUpdatesPackageVersion)
  );
  addMetaDataItemToMainApplication(
    mainApplication,
    Config.LAUNCH_WAIT_MS,
    String(getUpdatesTimeout(config))
  );

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
export function ensureBuildGradleContainsConfigurationScript(
  projectRoot: string,
  buildGradleContents: string
): string {
  if (!isBuildGradleConfigured(projectRoot, buildGradleContents)) {
    let cleanedUpBuildGradleContents;

    const isBuildGradleMisconfigured = buildGradleContents
      .split('\n')
      .some((line) => line.includes(CREATE_MANIFEST_ANDROID_PATH));
    if (isBuildGradleMisconfigured) {
      cleanedUpBuildGradleContents = buildGradleContents.replace(
        new RegExp(`(\n// Integration with Expo updates)?\n.*${CREATE_MANIFEST_ANDROID_PATH}.*\n`),
        ''
      );
    } else {
      cleanedUpBuildGradleContents = buildGradleContents;
    }

    const gradleScriptApply = formatApplyLineForBuildGradle(projectRoot);
    return `${cleanedUpBuildGradleContents}\n// Integration with Expo updates\n${gradleScriptApply}\n`;
  } else {
    return buildGradleContents;
  }
}

export function formatApplyLineForBuildGradle(projectRoot: string): string {
  const updatesGradleScriptPath = resolveFrom.silent(projectRoot, CREATE_MANIFEST_ANDROID_PATH);

  if (!updatesGradleScriptPath) {
    throw new Error(
      "Could not find the build script for Android. This could happen in case of outdated 'node_modules'. Run 'npm install' to make sure that it's up-to-date."
    );
  }

  const relativePath = path.relative(
    path.join(projectRoot, 'android', 'app'),
    updatesGradleScriptPath
  );
  const posixPath = process.platform === 'win32' ? relativePath.replace(/\\/g, '/') : relativePath;

  return `apply from: "${posixPath}"`;
}

export function isBuildGradleConfigured(projectRoot: string, buildGradleContents: string): boolean {
  const androidBuildScript = formatApplyLineForBuildGradle(projectRoot);

  return (
    buildGradleContents
      .replace(/\r\n/g, '\n')
      .split('\n')
      // Check for both single and double quotes
      .some((line) => line === androidBuildScript || line === androidBuildScript.replace(/"/g, "'"))
  );
}

export function isMainApplicationMetaDataSet(androidManifest: AndroidManifest): boolean {
  const updateUrl = getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL);
  const runtimeVersion = getMainApplicationMetaDataValue(androidManifest, Config.RUNTIME_VERSION);

  return Boolean(updateUrl && runtimeVersion);
}

export async function isMainApplicationMetaDataSyncedAsync(
  projectRoot: string,
  config: ExpoConfigUpdates,
  androidManifest: AndroidManifest
): Promise<boolean> {
  return (
    getUpdateUrl(config) === getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL) &&
    String(getUpdatesEnabled(config)) ===
      getMainApplicationMetaDataValue(androidManifest, Config.ENABLED) &&
    String(getUpdatesTimeout(config)) ===
      getMainApplicationMetaDataValue(androidManifest, Config.LAUNCH_WAIT_MS) &&
    getUpdatesCheckOnLaunch(config) ===
      getMainApplicationMetaDataValue(androidManifest, Config.CHECK_ON_LAUNCH) &&
    getUpdatesCodeSigningCertificate(projectRoot, config) ===
      getMainApplicationMetaDataValue(androidManifest, Config.CODE_SIGNING_CERTIFICATE) &&
    getUpdatesCodeSigningMetadataStringified(config) ===
      getMainApplicationMetaDataValue(androidManifest, Config.CODE_SIGNING_METADATA) &&
    (await areVersionsSyncedAsync(projectRoot, config, androidManifest))
  );
}

export async function areVersionsSyncedAsync(
  projectRoot: string,
  config: Pick<ExpoConfigUpdates, 'runtimeVersion' | 'sdkVersion'>,
  androidManifest: AndroidManifest
): Promise<boolean> {
  const expectedRuntimeVersion = await getRuntimeVersionNullableAsync(
    projectRoot,
    config,
    'android'
  );

  const currentRuntimeVersion = getMainApplicationMetaDataValue(
    androidManifest,
    Config.RUNTIME_VERSION
  );
  const currentSdkVersion = getMainApplicationMetaDataValue(
    androidManifest,
    'expo.modules.updates.EXPO_SDK_VERSION'
  );

  if (expectedRuntimeVersion !== null) {
    return currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === null;
  } else {
    return true;
  }
}
