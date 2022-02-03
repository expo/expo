import { CodedError, NativeModulesProxy } from 'expo-modules-core';
import { Platform, NativeModules } from 'react-native';
import { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants';
export { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, };
if (!ExponentConstants) {
    console.warn("No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?");
}
let rawManifest = null;
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
        rawManifest = updatesManifest;
    }
}
// If dev-launcher defines a non-empty manifest, prefer that one
if (NativeModules.EXDevLauncher) {
    let devLauncherManifest;
    if (NativeModules.EXDevLauncher.manifestString) {
        devLauncherManifest = JSON.parse(NativeModules.EXDevLauncher.manifestString);
    }
    if (devLauncherManifest && Object.keys(devLauncherManifest).length > 0) {
        rawManifest = devLauncherManifest;
    }
}
// Fall back to ExponentConstants.manifest if we don't have one from Updates
if (!rawManifest && ExponentConstants && ExponentConstants.manifest) {
    rawManifest = ExponentConstants.manifest;
    // On Android we pass the manifest in JSON form so this step is necessary
    if (typeof rawManifest === 'string') {
        rawManifest = JSON.parse(rawManifest);
    }
}
const { name, appOwnership, ...nativeConstants } = (ExponentConstants || {});
let warnedAboutDeviceYearClass = false;
let warnedAboutIosModel = false;
const constants = {
    ...nativeConstants,
    // Ensure this is null in bare workflow
    appOwnership: appOwnership ?? null,
};
Object.defineProperties(constants, {
    // Deprecated field
    deviceYearClass: {
        get() {
            if (!warnedAboutDeviceYearClass) {
                console.warn(`Constants.deviceYearClass has been deprecated in favor of expo-device's Device.deviceYearClass property. This API will be removed in SDK 45.`);
                warnedAboutDeviceYearClass = true;
            }
            return nativeConstants.deviceYearClass;
        },
        enumerable: false,
    },
    installationId: {
        get() {
            return nativeConstants.installationId;
        },
        enumerable: false,
    },
    /**
     * Use `manifest` property by default.
     * This property is only used for internal purposes.
     * It behaves similarly to the original one, but suppresses warning upon no manifest available.
     * `expo-asset` uses it to prevent users from seeing mentioned warning.
     */
    __unsafeNoWarnManifest: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest || !isAppManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    __unsafeNoWarnManifest2: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest || !isManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    manifest: {
        get() {
            const maybeManifest = getManifest();
            if (!maybeManifest || !isAppManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    manifest2: {
        get() {
            const maybeManifest = getManifest();
            if (!maybeManifest || !isManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    __rawManifest_TEST: {
        get() {
            return rawManifest;
        },
        set(value) {
            rawManifest = value;
        },
        enumerable: false,
    },
});
// Add deprecation warning for `platform.ios.model`
if (constants?.platform?.ios) {
    const originalModel = nativeConstants.platform.ios.model;
    Object.defineProperty(constants.platform.ios, 'model', {
        get() {
            if (!warnedAboutIosModel) {
                console.warn(`Constants.platform.ios.model has been deprecated in favor of expo-device's Device.modelName property. This API will be removed in SDK 45.`);
                warnedAboutIosModel = true;
            }
            return originalModel;
        },
        enumerable: false,
    });
}
function isAppManifest(manifest) {
    return !isManifest(manifest);
}
function isManifest(manifest) {
    return 'metadata' in manifest;
}
function getManifest(suppressWarning = false) {
    if (!rawManifest) {
        const invalidManifestType = rawManifest === null ? 'null' : 'undefined';
        if (nativeConstants.executionEnvironment === ExecutionEnvironment.Bare &&
            Platform.OS !== 'web') {
            if (!suppressWarning) {
                console.warn(`Constants.manifest is ${invalidManifestType} because the embedded app.config could not be read. Ensure that you have installed the expo-constants build scripts if you need to read from Constants.manifest.`);
            }
        }
        else if (nativeConstants.executionEnvironment === ExecutionEnvironment.StoreClient ||
            nativeConstants.executionEnvironment === ExecutionEnvironment.Standalone) {
            // If we somehow get here, this is a truly exceptional state to be in.
            // Constants.manifest should *always* be defined in those contexts.
            throw new CodedError('ERR_CONSTANTS_MANIFEST_UNAVAILABLE', `Constants.manifest is ${invalidManifestType}, must be an object.`);
        }
    }
    return rawManifest;
}
export default constants;
//# sourceMappingURL=Constants.js.map