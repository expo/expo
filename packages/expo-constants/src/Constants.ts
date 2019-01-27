import {
  AndroidManifest,
  AppOwnership,
  IOSManifest,
  NativeConstantsInterface,
  UserInterfaceIdiom,
  WebManifest,
} from './Constants.types';
import ExponentConstants from './ExponentConstants';

export { AppOwnership, UserInterfaceIdiom, IOSManifest, AndroidManifest, WebManifest };

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

const { name, ...Constants } = (ExponentConstants || {}) as any;

export interface ConstantsInterface extends NativeConstantsInterface {
  deviceId?: string;
  linkingUrl?: string;
}

export default {
  ...Constants,
  manifest,
  // Legacy aliases
  deviceId: Constants.installationId,
  linkingUrl: Constants.linkingUri,
} as ConstantsInterface;
