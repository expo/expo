// @flow

import invariant from 'invariant';
import { Platform } from 'react-native';
import { NativeModulesProxy } from 'expo-core';

const { ExpoLocalAuthentication: LocalAuthentication } = NativeModulesProxy;

type LocalAuthenticationResult = { success: true } | { success: false, error: string };

export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
};

type AuthenticationTypeType = $Keys<typeof AuthenticationType>;

export async function hasHardwareAsync(): Promise<boolean> {
  return LocalAuthentication.hasHardwareAsync();
}

export async function supportedAuthenticationTypesAsync(): Promise<Array<AuthenticationTypeType>> {
  return await LocalAuthentication.supportedAuthenticationTypesAsync();
}

export async function isEnrolledAsync(): Promise<boolean> {
  return LocalAuthentication.isEnrolledAsync();
}

export async function authenticateAsync(
  promptMessageIOS?: string = 'Authenticate'
): Promise<LocalAuthenticationResult> {
  if (Platform.OS === 'ios') {
    invariant(
      typeof promptMessageIOS === 'string' && promptMessageIOS.length,
      'Fingerprint.authenticateAsync must be called with a non-empty string on iOS'
    );

    const result = await LocalAuthentication.authenticateAsync(promptMessageIOS);

    if (result.warning) {
      console.warn(result.warning);
    }
    return result;
  } else {
    return LocalAuthentication.authenticateAsync();
  }
}

export function cancelAuthenticate(): void {
  LocalAuthentication.cancelAuthenticate();
}
