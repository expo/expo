import { UnavailabilityError } from 'expo-modules-core';
import invariant from 'invariant';

import ExpoLocalAuthentication from './ExpoLocalAuthentication';
import {
  LocalAuthenticationOptions,
  AuthenticationType,
  LocalAuthenticationResult,
  SecurityLevel,
  BiometricsSecurityLevel,
  LocalAuthenticationError,
} from './LocalAuthentication.types';

export {
  LocalAuthenticationOptions,
  AuthenticationType,
  LocalAuthenticationResult,
  SecurityLevel,
  BiometricsSecurityLevel,
  LocalAuthenticationError,
};

// @needsAudit
/**
 * Determine whether a face or fingerprint scanner is available on the device.
 * @return Returns a promise which fulfils with a `boolean` value indicating whether a face or
 * fingerprint scanner is available on this device.
 */
export async function hasHardwareAsync(): Promise<boolean> {
  if (!ExpoLocalAuthentication.hasHardwareAsync) {
    throw new UnavailabilityError('expo-local-authentication', 'hasHardwareAsync');
  }
  return await ExpoLocalAuthentication.hasHardwareAsync();
}

// @needsAudit
/**
 * Determine what kinds of authentications are available on the device.
 * @return Returns a promise which fulfils to an array containing [`AuthenticationType`s](#authenticationtype).
 *
 * Devices can support multiple authentication methods - i.e. `[1,2]` means the device supports both
 * fingerprint and facial recognition. If none are supported, this method returns an empty array.
 */
export async function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]> {
  if (!ExpoLocalAuthentication.supportedAuthenticationTypesAsync) {
    throw new UnavailabilityError('expo-local-authentication', 'supportedAuthenticationTypesAsync');
  }
  return await ExpoLocalAuthentication.supportedAuthenticationTypesAsync();
}

// @needsAudit
/**
 * Determine whether the device has saved fingerprints or facial data to use for authentication.
 * @return Returns a promise which fulfils to `boolean` value indicating whether the device has
 * saved fingerprints or facial data for authentication.
 */
export async function isEnrolledAsync(): Promise<boolean> {
  if (!ExpoLocalAuthentication.isEnrolledAsync) {
    throw new UnavailabilityError('expo-local-authentication', 'isEnrolledAsync');
  }
  return await ExpoLocalAuthentication.isEnrolledAsync();
}

// @needsAudit
/**
 * Determine what kind of authentication is enrolled on the device.
 * @return Returns a promise which fulfils with [`SecurityLevel`](#securitylevel).
 * > **Note:** On Android devices prior to M, `SECRET` can be returned if only the SIM lock has been
 * enrolled, which is not the method that [`authenticateAsync`](#localauthenticationauthenticateasyncoptions)
 * prompts.
 */
export async function getEnrolledLevelAsync(): Promise<SecurityLevel> {
  if (!ExpoLocalAuthentication.getEnrolledLevelAsync) {
    throw new UnavailabilityError('expo-local-authentication', 'getEnrolledLevelAsync');
  }
  return await ExpoLocalAuthentication.getEnrolledLevelAsync();
}

// @needsAudit
/**
 * Attempts to authenticate via Fingerprint/TouchID (or FaceID if available on the device).
 * > **Note:** Apple requires apps which use FaceID to provide a description of why they use this API.
 * If you try to use FaceID on an iPhone with FaceID without providing `infoPlist.NSFaceIDUsageDescription`
 * in `app.json`, the module will authenticate using device passcode. For more information about
 * usage descriptions on iOS, see [permissions guide](/guides/permissions/#ios).
 * @param options
 * @return Returns a promise which fulfils with [`LocalAuthenticationResult`](#localauthenticationresult).
 */
export async function authenticateAsync(
  options: LocalAuthenticationOptions = {}
): Promise<LocalAuthenticationResult> {
  if (!ExpoLocalAuthentication.authenticateAsync) {
    throw new UnavailabilityError('expo-local-authentication', 'authenticateAsync');
  }

  if (options.hasOwnProperty('promptMessage')) {
    invariant(
      typeof options.promptMessage === 'string' && options.promptMessage.length,
      'LocalAuthentication.authenticateAsync : `options.promptMessage` must be a non-empty string.'
    );
  }

  const promptMessage = options.promptMessage || 'Authenticate';
  const cancelLabel = options.cancelLabel || 'Cancel';
  const result = await ExpoLocalAuthentication.authenticateAsync({
    ...options,
    promptMessage,
    cancelLabel,
  });

  return result;
}

// @needsAudit
/**
 * Cancels authentication flow.
 * @platform android
 */
export async function cancelAuthenticate(): Promise<void> {
  if (!ExpoLocalAuthentication.cancelAuthenticate) {
    throw new UnavailabilityError('expo-local-authentication', 'cancelAuthenticate');
  }
  await ExpoLocalAuthentication.cancelAuthenticate();
}
