import { v4 as uuidv4 } from 'uuid';
const INSTALLATION_ID_KEY = 'installationId';
let installationId = null;
export default async function getInstallationIdAsync() {
    // Already cached value
    if (installationId) {
        return installationId;
    }
    try {
        // No cached value, fetch from persisted storage
        installationId = localStorage.getItem(INSTALLATION_ID_KEY);
        if (installationId) {
            return installationId;
        }
    }
    catch (error) {
        // If we weren't able to fetch one (for whatever reason)
        // let's create a new one.
    }
    // No persisted value, set the cached value...
    installationId = uuidv4();
    // ...and try to persist it. Ignore the errors.
    try {
        localStorage.setItem(INSTALLATION_ID_KEY, installationId);
    }
    catch (error) {
        console.debug('Could not save installation ID in persisted storage, it will get reset.', error);
    }
    return installationId;
}
//# sourceMappingURL=getInstallationIdAsync.web.js.map