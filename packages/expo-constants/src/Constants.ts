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

// On Android we pass the manifest in JSON form so this step is necessary
let manifest = null;
if (ExponentConstants && ExponentConstants.manifest) {
  manifest = ExponentConstants.manifest;
  if (typeof manifest === 'string') {
    manifest = JSON.parse(manifest);
  }
} else if (NativeModulesProxy.ExpoUpdates) {
  // in the bare workflow, manifest is not defined on ExponentConstants, but we can try to get it
  // from expo-updates
  if (NativeModulesProxy.ExpoUpdates.manifest) {
    manifest = NativeModulesProxy.ExpoUpdates.manifest;
  } else if (NativeModulesProxy.ExpoUpdates.manifestString) {
    manifest = JSON.parse(NativeModulesProxy.ExpoUpdates.manifestString);
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
