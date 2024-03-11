import { AndroidConfig, XML } from '@expo/config-plugins';
import * as Fingerprint from '@expo/fingerprint';
import fs from 'fs/promises';
import path from 'path';

export async function createFingerprintAsync(
  projectRoot: string,
  platform: 'ios' | 'android',
  workflow: 'managed' | 'generic',
  options: Fingerprint.Options
): Promise<Fingerprint.Fingerprint> {
  if (workflow === 'generic') {
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      ...options,
      platforms: [platform],
      extraSources: await getBareConfigurationEASBuildSourcesAsync(projectRoot, platform),
      ignorePaths: [
        // EAS Build injects this file at build time, can safely be ignored
        '**/android/app/eas-build.gradle',

        // EAS Build modifies this file at build time, handled by getAppBuildGradleSourceAsync
        '**/android/app/build.gradle',

        // EAS Build modifies this file at build time, handled by getAndroidManifestSourceAsync
        '**/android/app/src/main/AndroidManifest.xml',
      ],
    });
  } else {
    // ignore everything in native directories to ensure fingerprint is the same
    // no matter whether project has been prebuilt
    return await Fingerprint.createFingerprintAsync(projectRoot, {
      ...options,
      platforms: [platform],
      ignorePaths: ['android/**/*', 'ios/**/*'],
    });
  }
}

async function getBareConfigurationEASBuildSourcesAsync(
  projectRoot: string,
  platform: 'ios' | 'android'
): Promise<Fingerprint.HashSource[]> {
  switch (platform) {
    case 'android':
      return await Promise.all([
        getAppBuildGradleSourceAsync(projectRoot),
        getAndroidManifestSourceAsync(projectRoot),
      ]);
    case 'ios':
      return await Promise.all([
        getAppBuildGradleSourceAsync(projectRoot),
        getAndroidManifestSourceAsync(projectRoot),
      ]);
  }
}

/**
 * "Inverts" the configureBuildGradle step of eas-build for hashing when used in combination with ignore of eas-build.gradle above.
 */
async function getAppBuildGradleSourceAsync(projectRoot: string): Promise<Fingerprint.HashSource> {
  const APPLY_EAS_BUILD_GRADLE_LINE = 'apply from: "./eas-build.gradle"';

  const buildGradlePath = AndroidConfig.Paths.getAppBuildGradleFilePath(projectRoot);
  const buildGradleContents = await fs.readFile(path.join(buildGradlePath), 'utf8');

  const normalizedBuildGradleContents = buildGradleContents
    .replace(APPLY_EAS_BUILD_GRADLE_LINE, '')
    .trim();

  const id = 'android:buildgradle:contents';
  return {
    type: 'contents',
    id,
    contents: normalizedBuildGradleContents,
    reasons: [id],
  };
}

/**
 * "Inverts" the non-hashable portion of configureExpoUpdatesIfInstalledAsync step of eas-build for hashing when used in combination with ignores above.
 */
async function getAndroidManifestSourceAsync(projectRoot: string): Promise<Fingerprint.HashSource> {
  const UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY =
    'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY';

  const manifestPath = await AndroidConfig.Paths.getAndroidManifestAsync(projectRoot);
  const androidManifest = await AndroidConfig.Manifest.readAndroidManifestAsync(manifestPath);
  const mainApp = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  const stringifiedUpdatesRequestHeaders = AndroidConfig.Manifest.getMainApplicationMetaDataValue(
    androidManifest,
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY
  );
  // normalize the values set by eas-build. in this case, expo-channel-name
  AndroidConfig.Manifest.addMetaDataItemToMainApplication(
    mainApp,
    UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY,
    JSON.stringify({
      ...JSON.parse(stringifiedUpdatesRequestHeaders ?? '{}'),
      'expo-channel-name': undefined,
    }),
    'value'
  );
  const normalizedManifestXml = XML.format(androidManifest);

  const id = 'android:appmanifest:contents';
  return {
    type: 'contents',
    id,
    contents: normalizedManifestXml,
    reasons: [id],
  };
}
