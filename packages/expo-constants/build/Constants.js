import { NativeModulesProxy } from '@unimodules/core';
import { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants';
export { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, };
if (!ExponentConstants) {
    console.warn("No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?");
}
let manifest = null;
// If expo-updates defines a non-empty manifest, prefer that one
if (NativeModulesProxy.ExpoUpdates) {
    let updatesManifest;
    if (NativeModulesProxy.ExpoUpdates.manifest) {
        updatesManifest = NativeModulesProxy.ExpoUpdates.manifest;
    }
    else if (NativeModulesProxy.ExpoUpdates.manifestString) {
        updatesManifest = JSON.parse(NativeModulesProxy.ExpoUpdates.manifestString);
    }
    if (updatesManifest && Object.keys(updatesManifest).length > 0) {
        manifest = updatesManifest;
    }
}
// Fall back to ExponentConstants.manifest if we don't have one from Updates
if (!manifest && ExponentConstants && ExponentConstants.manifest) {
    manifest = ExponentConstants.manifest;
    // On Android we pass the manifest in JSON form so this step is necessary
    if (typeof manifest === 'string') {
        manifest = JSON.parse(manifest);
    }
}
const { name, appOwnership, ...nativeConstants } = (ExponentConstants || {});
const constants = {
    ...nativeConstants,
    // Ensure this is null in bare workflow
    appOwnership: appOwnership ?? null,
    // Legacy aliases
    deviceId: nativeConstants.installationId,
    linkingUrl: nativeConstants.linkingUri,
};
Object.defineProperties(constants, {
    manifest: {
        enumerable: true,
        get() {
            if (!manifest) {
                console.warn("Constants.manifest is null or undefined. If you're using the bare workflow, this means the embedded config could not be read. Make sure you have installed the expo-constants build scripts.");
            }
            return manifest;
        },
    },
});
export default constants;
//# sourceMappingURL=Constants.js.map