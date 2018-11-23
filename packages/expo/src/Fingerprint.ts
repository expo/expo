import invariant from 'invariant';
import { NativeModules, Platform } from 'react-native';
import UnsupportedError from './UnsupportedError';

const {
  ExponentFingerprint = {
    get name() {
      return 'ExponentFingerprint';
    },
  },
} = NativeModules;

type FingerprintAuthenticationResult = { success: true } | { success: false; error: string };

export function hasHardwareAsync(): Promise<boolean> {
  if (!ExponentFingerprint.hasHardwareAsync) {
    throw new UnsupportedError('Fingerprint', 'hasHardwareAsync');
  }
  return ExponentFingerprint.hasHardwareAsync();
}

export function isEnrolledAsync(): Promise<boolean> {
  if (!ExponentFingerprint.isEnrolledAsync) {
    throw new UnsupportedError('Fingerprint', 'isEnrolledAsync');
  }
  return ExponentFingerprint.isEnrolledAsync();
}

export function authenticateAsync(
  promptMessageIOS: string = 'Authenticate'
): Promise<FingerprintAuthenticationResult> {
  if (!ExponentFingerprint.authenticateAsync) {
    throw new UnsupportedError('Fingerprint', 'authenticateAsync');
  }

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
  if (!ExponentFingerprint.cancelAuthenticate) {
    throw new UnsupportedError('Fingerprint', 'cancelAuthenticate');
  }
  return ExponentFingerprint.cancelAuthenticate();
}
