import { Platform } from 'react-native';

import ExpoAppIntegrity from './ExpoAppIntegrity';

/**
 * A boolean value that indicates whether a particular device provides the [App Attest](https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity) service.
 * Not all device types support the App Attest service, so check for support before using the service.
 * @platform ios
 */
export const isSupported = Platform.OS === 'ios' ? ExpoAppIntegrity.isSupported : true;

/**
 * Creates a new cryptographic key for use with the App Attest service.
 * @return A Promise that is fulfilled with a string that contains the key identifier. The key itself is stored securely in the Secure Enclave.
 * @platform ios
 */
export async function generateKey() {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return ExpoAppIntegrity.generateKey();
}

/**
 * Asks Apple to attest to the validity of a generated cryptographic key.
 * @param keyId The identifier you received by calling the `generateKey` function.
 * @param challenge A challenge string from your server.
 * @return A Promise that is fulfilled with a string that contains the attestation data. A statement from Apple about the validity of the key associated with keyId. Send this to your server for processing.
 * @platform ios
 */
export async function attestKey(keyId: string, challenge: string) {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return ExpoAppIntegrity.attestKey(keyId, challenge);
}

/**
 * Creates a block of data that demonstrates the legitimacy of an instance of your app running on a device.
 * @param keyId The identifier you received by calling the `generateKey` function.
 * @param challenge A string to be signed with the attested private key.
 * @return A Promise that is fulfilled with a string that contains the assertion object. A data structure that you send to your server for processing.
 * @platform ios
 */
export async function generateAssertion(keyId: string, challenge: string) {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return ExpoAppIntegrity.generateAssertion(keyId, challenge);
}

/**
 * Prepares the integrity token provider for the given cloud project number.
 * @param cloudProjectNumber The cloud project number.
 * @return A Promise that is fulfilled if the integrity token provider is prepared successfully.
 * @platform android
 */
export async function prepareIntegrityTokenProvider(cloudProjectNumber: string) {
  if (Platform.OS !== 'android') {
    throw new Error('prepareIntegrityTokenProvider is only available on Android');
  }
  return ExpoAppIntegrity.prepareIntegrityTokenProvider(cloudProjectNumber);
}

/**
 * Requests an integrity verdict for the given request hash from Google Play.
 * @param requestHash A string representing the request hash.
 * @return A Promise that is fulfilled with a string that contains the integrity check result.
 * @platform android
 */
export async function requestIntegrityCheck(requestHash: string) {
  if (Platform.OS !== 'android') {
    throw new Error('requestIntegrityCheck is only available on Android');
  }
  return ExpoAppIntegrity.requestIntegrityCheck(requestHash);
}
