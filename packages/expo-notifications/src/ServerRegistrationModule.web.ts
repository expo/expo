import uuidv4 from 'uuid/v4';

import { ServerRegistrationModule } from './ServerRegistrationModule.types';

const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';
const REGISTRATION_INFO_KEY = 'EXPO_NOTIFICATIONS_REGISTRATION_INFO';

// Lazy fallback installationId per session initializer
let getFallbackInstallationId = () => {
  const sessionInstallationId = uuidv4();
  getFallbackInstallationId = () => sessionInstallationId;
};

export default {
  getInstallationIdAsync: async () => {
    let installationId;

    try {
      installationId = localStorage.getItem(INSTALLATION_ID_KEY);
      if (!installationId || typeof installationId !== 'string') {
        installationId = uuidv4();
        localStorage.setItem(INSTALLATION_ID_KEY, installationId);
      }
    } catch (error) {
      installationId = getFallbackInstallationId();
    }

    return installationId;
  },
  getRegistrationInfoAsync: async () => {
    return localStorage.getItem(REGISTRATION_INFO_KEY);
  },
  setRegistrationInfoAsync: async (registrationInfo: string | null) => {
    if (registrationInfo) {
      localStorage.setItem(REGISTRATION_INFO_KEY, registrationInfo);
    } else {
      localStorage.removeItem(REGISTRATION_INFO_KEY);
    }
  },
  // mock implementations
  addListener: () => {},
  removeListeners: () => {},
} as ServerRegistrationModule;
