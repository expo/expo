import { CodedError } from 'expo-modules-core';
import { randomUUID } from 'expo-crypto';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';
const REGISTRATION_INFO_KEY = 'EXPO_NOTIFICATIONS_REGISTRATION_INFO';

// Lazy fallback installationId per session initializer
let getFallbackInstallationId = () => {
  const sessionInstallationId = randomUUID();
  getFallbackInstallationId = () => sessionInstallationId;
};

export default {
  getInstallationIdAsync: async () => {
    let installationId;

    try {
      installationId = localStorage.getItem(INSTALLATION_ID_KEY);
      if (!installationId || typeof installationId !== 'string') {
        installationId = randomUUID();
        localStorage.setItem(INSTALLATION_ID_KEY, installationId);
      }
    } catch {
      installationId = getFallbackInstallationId();
    }

    return installationId;
  },
  getRegistrationInfoAsync: async () => {
    return localStorage.getItem(REGISTRATION_INFO_KEY);
  },
  setRegistrationInfoAsync: async (registrationInfo: string | null) => {
    try {
      if (registrationInfo) {
        localStorage.setItem(REGISTRATION_INFO_KEY, registrationInfo);
      } else {
        localStorage.removeItem(REGISTRATION_INFO_KEY);
      }
    } catch (error) {
      throw new CodedError(
        'ERR_NOTIFICATIONS_STORAGE_ERROR',
        `Could not modify localStorage to persist auto-registration information: ${error}`
      );
    }
  },
  // mock implementations
  addListener: () => {},
  removeListeners: () => {},
} as ServerRegistrationModule;
