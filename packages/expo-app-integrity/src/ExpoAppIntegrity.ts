import { Platform } from 'react-native';

import IntegrityModule from './IntegrityModule';

export function isAvailable() {
  IntegrityModule.isAvailable();
}

export async function generateKey() {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return IntegrityModule.generateKey();
}

export async function attestKey(key: string, challenge: string) {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return IntegrityModule.attestKey(key, challenge);
}

export async function generateAssertion(key: string, json: string) {
  if (Platform.OS !== 'ios') {
    throw new Error('generateAssertion is only available on iOS');
  }
  return IntegrityModule.generateAssertion(key, json);
}

export async function requestIntegrityCheck(challenge: string) {
  if (Platform.OS !== 'android') {
    throw new Error('requestIntegrityCheck is only available on Android');
  }
  return IntegrityModule.requestIntegrityCheck(challenge);
}
