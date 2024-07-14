
import * as AppleImpl from '../apple/Maps';

export const withMaps = AppleImpl.withMaps('ios');
export const getGoogleMapsApiKey = AppleImpl.getGoogleMapsApiKey('ios');
export const setGoogleMapsApiKey = AppleImpl.setGoogleMapsApiKey('ios');

export {
  MATCH_INIT,
  addGoogleMapsAppDelegateImport,
  removeGoogleMapsAppDelegateImport,
  addGoogleMapsAppDelegateInit,
  removeGoogleMapsAppDelegateInit,
  addMapsCocoaPods,
  removeMapsCocoaPods,
} from '../apple/Maps';
