import {
  AndroidManifest,
  AppOwnership,
  IOSManifest,
  PlatformManifest,
  NativeConstants,
  UserInterfaceIdiom,
  WebManifest,
} from './Constants.types';
import ExponentConstants from './ExponentConstants';

export {
  AppOwnership,
  UserInterfaceIdiom,
  PlatformManifest,
  NativeConstants,
  IOSManifest,
  AndroidManifest,
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
}

const { name, ...constants } = (ExponentConstants || {}) as any;

export interface Constants extends NativeConstants {
  deviceId?: string;
  linkingUrl?: string;
}

export default {
  ...constants,
  manifest,
  // Legacy aliases
  deviceId: constants.installationId,
  linkingUrl: constants.linkingUri,
} as Constants;
