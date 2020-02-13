import UUID from 'uuid-js';
const INSTALLATION_ID_KEY = 'EXPO_NOTIFICATIONS_INSTALLATION_ID';
// Lazy fallback installationId per session initializer
let getFallbackInstallationId = () => {
    const sessionInstallationId = UUID.create().toString();
    getFallbackInstallationId = () => sessionInstallationId;
};
export default {
    getInstallationIdAsync: async () => {
        let installationId;
        try {
            installationId = localStorage.getItem(INSTALLATION_ID_KEY);
            if (!installationId || typeof installationId !== 'string') {
                installationId = UUID.create().toString();
                localStorage.setItem(INSTALLATION_ID_KEY, installationId);
            }
        }
        catch (error) {
            installationId = getFallbackInstallationId();
        }
        return installationId;
    },
    // mock implementations
    addListener: () => { },
    removeListeners: () => { },
};
//# sourceMappingURL=InstallationIdProvider.web.js.map