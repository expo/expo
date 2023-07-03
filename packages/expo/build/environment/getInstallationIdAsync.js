import * as Application from 'expo-application';
import { uuid } from 'expo-modules-core';
let installationId;
export default async function getInstallationIdAsync() {
    if (installationId) {
        return installationId;
    }
    const identifierForVendor = await Application.getIosIdForVendorAsync();
    const bundleIdentifier = Application.applicationId;
    // It's unlikely identifierForVendor will be null (it returns null if the
    // device has been restarted but not yet unlocked), but let's handle this
    // case.
    if (identifierForVendor) {
        installationId = uuid(`${bundleIdentifier}-${identifierForVendor}`);
    }
    else {
        const installationTime = await Application.getInstallationTimeAsync();
        installationId = uuid(`${bundleIdentifier}-${installationTime.getTime()}`);
    }
    return installationId;
}
//# sourceMappingURL=getInstallationIdAsync.js.map