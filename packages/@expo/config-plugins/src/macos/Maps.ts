import * as AppleImpl from '../apple/Maps';

export const withMaps = AppleImpl.withMaps('macos');
export const getGoogleMapsApiKey = AppleImpl.getGoogleMapsApiKey('macos');
export const setGoogleMapsApiKey = AppleImpl.setGoogleMapsApiKey('macos');

export {
  MATCH_INIT,
  addGoogleMapsAppDelegateImport,
  removeGoogleMapsAppDelegateImport,
  addGoogleMapsAppDelegateInit,
  removeGoogleMapsAppDelegateInit,
  addMapsCocoaPods,
  removeMapsCocoaPods,
} from '../apple/Maps';
