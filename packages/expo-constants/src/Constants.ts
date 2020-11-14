import { NativeModulesProxy } from '@unimodules/core';

import {
  AndroidManifest,
  AppOwnership,
  Constants,
  ExecutionEnvironment,
  IOSManifest,
  NativeConstants,
  PlatformManifest,
  UserInterfaceIdiom,
  WebManifest,
} from './Constants.types';
import ExponentConstants from './ExponentConstants';

export {
  AndroidManifest,
  AppOwnership,
  Constants,
  ExecutionEnvironment,
  IOSManifest,
  NativeConstants,
  PlatformManifest,
  UserInterfaceIdiom,
  WebManifest,
};

if (!ExponentConstants) {
  console.warn(
    "No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?"
  );
}

let manifest = null;
// If expo-updates defines a non-empty manifest, prefer that one
if (NativeModulesProxy.ExpoUpdates) {
  let updatesManifest;
  if (NativeModulesProxy.ExpoUpdates.manifest) {
    updatesManifest = NativeModulesProxy.ExpoUpdates.manifest;
  } else if (NativeModulesProxy.ExpoUpdates.manifestString) {
    updatesManifest = JSON.parse(NativeModulesProxy.ExpoUpdates.manifestString);
  }
  if (updatesManifest && Object.keys(updatesManifest).length > 0) {
    manifest = updatesManifest;
  }
}

// Fall back to ExponentConstants.manifest if we don't have one from Updates
if (!manifest && ExponentConstants && ExponentConstants.manifest) {
  manifest = ExponentConstants.manifest;
  // On Android we pass the manifest in JSON form so this step is necessary
  if (typeof manifest === 'string') {
    manifest = JSON.parse(manifest);
  }
}

const { name, appOwnership, ...constants } = (ExponentConstants || {}) as any;

export default {
  ...constants,
  // Ensure this is null in bare workflow
  appOwnership: appOwnership ?? null,
  manifest,
  // Legacy aliases
  deviceId: constants.installationId,
  linkingUrl: constants.linkingUri,
} as Constants;
