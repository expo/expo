import { ConfigPlugin, withAndroidManifest, AndroidConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import path from 'path';
import resolveFrom from 'resolve-from';

const {
  addMetaDataItemToMainApplication,
  getMainApplicationMetaDataValue,
  getMainApplicationOrThrow,
  removeMetaDataItemFromMainApplication,
} = AndroidConfig.Manifest;

const CREATE_MANIFEST_ANDROID_PATH = 'expo-updates/scripts/create-manifest-android.gradle';

type ExpoConfigUpdates = Pick<
  ExpoConfig,
  'sdkVersion' | 'owner' | 'runtimeVersion' | 'updates' | 'slug'
>;

export enum Config {
  ENABLED = 'expo.modules.updates.ENABLED',
  CHECK_ON_LAUNCH = 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH',
  LAUNCH_WAIT_MS = 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS',
  SDK_VERSION = 'expo.modules.updates.EXPO_SDK_VERSION',
  RUNTIME_VERSION = 'expo.modules.updates.EXPO_RUNTIME_VERSION',
  UPDATE_URL = 'expo.modules.updates.EXPO_UPDATE_URL',
}

export const withUpdatesAndroid: ConfigPlugin<{ expoUsername: string | null }> = (
  config,
  { expoUsername }
) => {
  return withAndroidManifest(config, config => {
    config.modResults = setUpdatesConfig(config, config.modResults, expoUsername);
    return config;
  });
};

export function getUpdateUrl(
  config: Pick<ExpoConfigUpdates, 'owner' | 'slug'>,
  username: string | null
): string | null {
  const user = typeof config.owner === 'string' ? config.owner : username;
  if (!user) {
    return null;
  }
  return `https://exp.host/@${user}/${config.slug}`;
}

export function getRuntimeVersion(
  config: Pick<ExpoConfigUpdates, 'runtimeVersion'>
): string | null {
  return typeof config.runtimeVersion === 'string' ? config.runtimeVersion : null;
}

export function getSDKVersion(config: Pick<ExpoConfigUpdates, 'sdkVersion'>): string | null {
  return typeof config.sdkVersion === 'string' ? config.sdkVersion : null;
}

export function getUpdatesEnabled(config: Pick<ExpoConfigUpdates, 'updates'>): boolean {
  return config.updates?.enabled !== false;
}

export function getUpdatesTimeout(config: Pick<ExpoConfigUpdates, 'updates'>): number {
  return config.updates?.fallbackToCacheTimeout ?? 0;
}

export function getUpdatesCheckOnLaunch(
  config: Pick<ExpoConfigUpdates, 'updates'>
): 'NEVER' | 'ALWAYS' {
  if (config.updates?.checkAutomatically === 'ON_ERROR_RECOVERY') {
    return 'NEVER';
  } else if (config.updates?.checkAutomatically === 'ON_LOAD') {
    return 'ALWAYS';
  }
  return 'ALWAYS';
}

export function setUpdatesConfig(
  config: ExpoConfigUpdates,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  username: string | null
): AndroidConfig.Manifest.AndroidManifest {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  addMetaDataItemToMainApplication(
    mainApplication,
    Config.ENABLED,
    String(getUpdatesEnabled(config))
  );
  addMetaDataItemToMainApplication(
    mainApplication,
    Config.CHECK_ON_LAUNCH,
    getUpdatesCheckOnLaunch(config)
  );
  addMetaDataItemToMainApplication(
    mainApplication,
    Config.LAUNCH_WAIT_MS,
    String(getUpdatesTimeout(config))
  );

  const updateUrl = getUpdateUrl(config, username);
  if (updateUrl) {
    addMetaDataItemToMainApplication(mainApplication, Config.UPDATE_URL, updateUrl);
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.UPDATE_URL);
  }

  return setVersionsConfig(config, androidManifest);
}

export function setVersionsConfig(
  config: Pick<ExpoConfigUpdates, 'sdkVersion' | 'runtimeVersion'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  const mainApplication = getMainApplicationOrThrow(androidManifest);

  const runtimeVersion = getRuntimeVersion(config);
  const sdkVersion = getSDKVersion(config);
  if (runtimeVersion) {
    removeMetaDataItemFromMainApplication(mainApplication, Config.SDK_VERSION);
    addMetaDataItemToMainApplication(mainApplication, Config.RUNTIME_VERSION, runtimeVersion);
  } else if (sdkVersion) {
    removeMetaDataItemFromMainApplication(mainApplication, Config.RUNTIME_VERSION);
    addMetaDataItemToMainApplication(mainApplication, Config.SDK_VERSION, sdkVersion);
  } else {
    removeMetaDataItemFromMainApplication(mainApplication, Config.RUNTIME_VERSION);
    removeMetaDataItemFromMainApplication(mainApplication, Config.SDK_VERSION);
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
      .some(line => line.includes(CREATE_MANIFEST_ANDROID_PATH));
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

  return `apply from: ${JSON.stringify(
    path.relative(path.join(projectRoot, 'android', 'app'), updatesGradleScriptPath)
  )}`;
}

export function isBuildGradleConfigured(projectRoot: string, buildGradleContents: string): boolean {
  const androidBuildScript = formatApplyLineForBuildGradle(projectRoot);

  return (
    buildGradleContents
      .split('\n')
      // Check for both single and double quotes
      .some(line => line === androidBuildScript || line === androidBuildScript.replace(/"/g, "'"))
  );
}

export function isMainApplicationMetaDataSet(
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): boolean {
  const updateUrl = getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL);
  const runtimeVersion = getMainApplicationMetaDataValue(androidManifest, Config.RUNTIME_VERSION);
  const sdkVersion = getMainApplicationMetaDataValue(androidManifest, Config.SDK_VERSION);

  return Boolean(updateUrl && (sdkVersion || runtimeVersion));
}

export function isMainApplicationMetaDataSynced(
  config: ExpoConfigUpdates,
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  username: string | null
): boolean {
  return (
    getUpdateUrl(config, username) ===
      getMainApplicationMetaDataValue(androidManifest, Config.UPDATE_URL) &&
    String(getUpdatesEnabled(config)) ===
      getMainApplicationMetaDataValue(androidManifest, Config.ENABLED) &&
    String(getUpdatesTimeout(config)) ===
      getMainApplicationMetaDataValue(androidManifest, Config.LAUNCH_WAIT_MS) &&
    getUpdatesCheckOnLaunch(config) ===
      getMainApplicationMetaDataValue(androidManifest, Config.CHECK_ON_LAUNCH) &&
    areVersionsSynced(config, androidManifest)
  );
}

export function areVersionsSynced(
  config: Pick<ExpoConfigUpdates, 'runtimeVersion' | 'sdkVersion'>,
  androidManifest: AndroidConfig.Manifest.AndroidManifest
): boolean {
  const expectedRuntimeVersion = getRuntimeVersion(config);
  const expectedSdkVersion = getSDKVersion(config);
  const currentRuntimeVersion = getMainApplicationMetaDataValue(
    androidManifest,
    Config.RUNTIME_VERSION
  );
  const currentSdkVersion = getMainApplicationMetaDataValue(androidManifest, Config.SDK_VERSION);

  return (
    currentRuntimeVersion === expectedRuntimeVersion && currentSdkVersion === expectedSdkVersion
  );
}
