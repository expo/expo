import { ExpoConfig } from '@expo/config-types';

import { AndroidManifest, getMainActivityOrThrow } from './Manifest';
import { createAndroidManifestPlugin } from '../plugins/android-plugins';

export const SCREEN_ORIENTATION_ATTRIBUTE = 'android:screenOrientation';

export const withOrientation = createAndroidManifestPlugin(
  setAndroidOrientation,
  'withOrientation'
);

export function getOrientation(config: Pick<ExpoConfig, 'orientation'>) {
  return typeof config.orientation === 'string' ? config.orientation : null;
}

export function setAndroidOrientation(
  config: Pick<ExpoConfig, 'orientation'>,
  androidManifest: AndroidManifest
) {
  const orientation = getOrientation(config);
  // TODO: Remove this if we decide to remove any orientation configuration when not specified
  if (!orientation) {
    return androidManifest;
  }

  const mainActivity = getMainActivityOrThrow(androidManifest);

  mainActivity.$[SCREEN_ORIENTATION_ATTRIBUTE] =
    orientation !== 'default' ? orientation : 'unspecified';

  return androidManifest;
}
