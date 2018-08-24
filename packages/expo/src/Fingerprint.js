// @flow

import invariant from 'invariant';
import { NativeModules, Platform } from 'react-native';

const { ExponentFingerprint } = NativeModules;

type FingerprintAuthenticationResult = { success: true } | { success: false, error: string };

export function hasHardwareAsync(): Promise<boolean> {
  return ExponentFingerprint.hasHardwareAsync();
}

export function isEnrolledAsync(): Promise<boolean> {
  return ExponentFingerprint.isEnrolledAsync();
}

export function authenticateAsync(
  promptMessageIOS?: string = 'Authenticate'
): Promise<FingerprintAuthenticationResult> {
  if (Platform.OS === 'ios') {
    invariant(
      typeof promptMessageIOS === 'string' && promptMessageIOS.length,
      'Fingerprint.authenticateAsync must be called with a non-empty string on iOS'
    );
    return ExponentFingerprint.authenticateAsync(promptMessageIOS);
  } else {
    return ExponentFingerprint.authenticateAsync();
  }
}

export function cancelAuthenticate(): void {
  ExponentFingerprint.cancelAuthenticate();
}
