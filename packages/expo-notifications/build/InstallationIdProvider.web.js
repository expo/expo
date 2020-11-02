import uuidv4 from 'uuid/v4';
const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';
const REGISTRATIONS_KEY = 'EXPO_NOTIFICATIONS_REGISTRATIONS';
// Lazy fallback installationId per session initializer
let getFallbackInstallationId = () => {
    const sessionInstallationId = uuidv4();
    getFallbackInstallationId = () => sessionInstallationId;
};
function getRegistrations() {
    try {
        return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) ?? '{}');
    }
    catch (e) {
        console.warn('expo-notification', 'Error encountered while fetching active registrations from localStorage. Falling back to empty dictionary.', e);
        return {};
    }
}
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
    getRegistrationsAsync: async () => getRegistrations(),
    setRegistrationAsync: async (scope, isRegistered) => {
        const registrations = getRegistrations();
        if (isRegistered) {
            registrations[scope] = true;
        }
        else {
            delete registrations[scope];
        }
        localStorage.setItem(REGISTRATIONS_KEY, registrations);
    },
    // mock implementations
    addListener: () => { },
    removeListeners: () => { },
};
//# sourceMappingURL=InstallationIdProvider.web.js.map