import uuidv4 from 'uuid/v4';

import { InstallationIdProvider } from './InstallationIdProvider.types';

const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';

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
  // mock implementations
  addListener: () => {},
  removeListeners: () => {},
} as InstallationIdProvider;
