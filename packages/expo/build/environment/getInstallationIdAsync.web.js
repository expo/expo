import uuidv4 from 'uuid/v4';
const INSTALLATION_ID_KEY = 'installationId';
export default async function getInstallationIdAsync() {
    const existingInstallationId = localStorage.getItem(INSTALLATION_ID_KEY);
    if (existingInstallationId) {
        return existingInstallationId;
    }
    const newInstallationId = uuidv4();
    localStorage.setItem(INSTALLATION_ID_KEY, newInstallationId);
    return newInstallationId;
}
//# sourceMappingURL=getInstallationIdAsync.web.js.map