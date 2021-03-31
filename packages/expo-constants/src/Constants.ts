import { CodedError, NativeModulesProxy } from '@unimodules/core';
import { Platform, NativeModules } from 'react-native';

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

// If dev-launcher defines a non-empty manifest, prefer that one
if (NativeModules.EXDevLauncher) {
  let devLauncherManifest;
  if (NativeModules.EXDevLauncher.manifestString) {
    devLauncherManifest = JSON.parse(NativeModules.EXDevLauncher.manifestString);
  }

  if (devLauncherManifest && Object.keys(devLauncherManifest).length > 0) {
    manifest = devLauncherManifest;
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

const { name, appOwnership, ...nativeConstants } = (ExponentConstants || {}) as any;

let warnedAboutInstallationId = false;
let warnedAboutDeviceId = false;
let warnedAboutLinkingUrl = false;

const constants = {
  ...nativeConstants,
  // Ensure this is null in bare workflow
  appOwnership: appOwnership ?? null,
  // Deprecated fields
  get installationId() {
    if (!warnedAboutInstallationId) {
      console.warn(
        `Constants.installationId has been deprecated in favor of generating and storing your own ID. Implement it using expo-application's androidId on Android and a storage API such as expo-secure-store on iOS and localStorage on the web. This API will be removed in SDK 44.`
      );
      warnedAboutInstallationId = true;
    }
    return nativeConstants.installationId;
  },
  // Legacy aliases
  get deviceId() {
    if (!warnedAboutDeviceId) {
      console.warn(
        `Constants.deviceId has been deprecated in favor of generating and storing your own ID. This API will be removed in SDK 44.`
      );
      warnedAboutDeviceId = true;
    }
    return nativeConstants.installationId;
  },
  get linkingUrl() {
    if (!warnedAboutLinkingUrl) {
      console.warn(
        `Constants.linkingUrl has been renamed to Constants.linkingUri. Consider using the Linking API directly. Constants.linkingUrl will be removed in SDK 44.`
      );
      warnedAboutLinkingUrl = true;
    }
    return nativeConstants.linkingUri;
  },
} as Constants;

function getManifest(suppressWarning = false) {
  if (!manifest) {
    const invalidManifestType = manifest === null ? 'null' : 'undefined';
    if (
      nativeConstants.executionEnvironment === ExecutionEnvironment.Bare &&
      Platform.OS !== 'web'
    ) {
      if (!suppressWarning) {
        console.warn(
          `Constants.manifest is ${invalidManifestType} because the embedded app.config could not be read. Ensure that you have installed the expo-constants build scripts if you need to read from Constants.manifest.`
        );
      }
    } else if (
      nativeConstants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      nativeConstants.executionEnvironment === ExecutionEnvironment.Standalone
    ) {
      // If we somehow get here, this is a truly exceptional state to be in.
      // Constants.manifest should *always* be defined in those contexts.
      throw new CodedError(
        'ERR_CONSTANTS_MANIFEST_UNAVAILABLE',
        `Constants.manifest is ${invalidManifestType}, must be an object.`
      );
    }
  }
  return manifest;
}

Object.defineProperties(constants, {
  manifest: {
    enumerable: true,
    get() {
      return getManifest();
    },
    // This setter is only useful to mock the value for tests
    set(value) {
      manifest = value;
    },
  },
  /**
   * Use `manifest` property by default.
   * This property is only used for internal purposes.
   * It behaves similarly to the original one, but suppresses warning upon no manifest available.
   * `expo-asset` uses it to prevent users from seeing mentioned warning.
   */
  __unsafeNoWarnManifest: {
    enumerable: true,
    get() {
      return getManifest(true);
    },
  },
});

export default constants as Constants;
