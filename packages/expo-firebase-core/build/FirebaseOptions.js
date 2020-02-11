//import { CodedError } from '@unimodules/core';
//import Constants from 'expo-constants';
export class FirebaseOptions {
}
/*export function getFirebaseOptionsFromAndroidManifest(): FirebaseOptions {
  const { manifest } = Constants;
  if (!manifest) throw new CodedError('ERR_MANIFEST', 'Manifest not available');
  const { googleServicesFile } = manifest;
  if (!googleServicesFile)
    throw new CodedError('ERR_MANIFEST', 'GoogleServicesFile is not configured in app.json');
  const json = JSON.parse(googleServicesFile);
  return getFirebaseOptionsFromAndroidGoogleServicesFile(json);
}

export function getFirebaseOptionsFromManifest(): FirebaseOptions {
  return getFirebaseOptionsFromAndroidManifest();
}*/
//# sourceMappingURL=FirebaseOptions.js.map