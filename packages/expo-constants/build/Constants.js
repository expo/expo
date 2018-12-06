import ExponentConstants from './ExponentConstants';
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
export default {
    ...ExponentConstants,
    manifest,
    // Legacy aliases
    deviceId: ExponentConstants ? ExponentConstants.installationId : undefined,
    linkingUrl: ExponentConstants ? ExponentConstants.linkingUri : undefined,
};
//# sourceMappingURL=Constants.js.map