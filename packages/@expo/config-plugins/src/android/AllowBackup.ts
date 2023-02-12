import { ExpoConfig } from '@expo/config-types';

import { createAndroidManifestPlugin } from '../plugins/android-plugins';
import { AndroidManifest, getMainApplication, StringBoolean } from './Manifest';

export const withAllowBackup = createAndroidManifestPlugin(setAllowBackup, 'withAllowBackup');

export function getAllowBackup(config: Pick<ExpoConfig, 'android'>) {
  // Defaults to true.
  // https://docs.expo.dev/versions/latest/config/app/#allowbackup
  return config.android?.allowBackup ?? true;
}

export function setAllowBackup(
  config: Pick<ExpoConfig, 'android'>,
  androidManifest: AndroidManifest
) {
  const allowBackup = getAllowBackup(config);

  const mainApplication = getMainApplication(androidManifest);
  if (mainApplication?.$) {
    mainApplication.$['android:allowBackup'] = String(allowBackup) as StringBoolean;
  }

  return androidManifest;
}

export function getAllowBackupFromManifest(androidManifest: AndroidManifest): boolean | null {
  const mainApplication = getMainApplication(androidManifest);

  if (mainApplication?.$) {
    return String(mainApplication.$['android:allowBackup']) === 'true';
  }

  return null;
}
