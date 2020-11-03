import uuidv4 from 'uuid/v4';
const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';
const LAST_REGISTRATION_INFO_KEY = 'EXPO_NOTIFICATIONS_LAST_REGISTRATION_INFO';
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
        }
        catch (error) {
            installationId = getFallbackInstallationId();
        }
        return installationId;
    },
    getLastRegistrationInfoAsync: async () => {
        return localStorage.getItem(LAST_REGISTRATION_INFO_KEY);
    },
    setLastRegistrationInfoAsync: async (lastRegistrationInfo) => {
        if (lastRegistrationInfo) {
            localStorage.setItem(LAST_REGISTRATION_INFO_KEY, lastRegistrationInfo);
        }
        else {
            localStorage.removeItem(LAST_REGISTRATION_INFO_KEY);
        }
    },
    // mock implementations
    addListener: () => { },
    removeListeners: () => { },
};
//# sourceMappingURL=ServerRegistrationModule.web.js.map