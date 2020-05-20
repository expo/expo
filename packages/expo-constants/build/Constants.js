import { AppOwnership, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants';
export { AppOwnership, UserInterfaceIdiom, };
if (!ExponentConstants) {
    console.warn("No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?");
}
// On Android we pass the manifest in JSON form so this step is necessary
let manifest = null;
if (ExponentConstants && ExponentConstants.manifest) {
    manifest = ExponentConstants.manifest;
    if (typeof manifest === 'string') {
        manifest = JSON.parse(manifest);
    }
}
const { name, appOwnership, ...constants } = (ExponentConstants || {});
export default {
    ...constants,
    // Ensure this is null in bare workflow
    appOwnership: appOwnership ?? null,
    manifest,
    // Legacy aliases
    deviceId: constants.installationId,
    linkingUrl: constants.linkingUri,
};
//# sourceMappingURL=Constants.js.map