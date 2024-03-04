import { CodedError, requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, NativeModules } from 'react-native';
import { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants';
export { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, };
if (!ExponentConstants) {
    console.warn("No native ExponentConstants module found, are you sure the expo-constants's module is linked properly?");
}
const ExpoUpdates = requireOptionalNativeModule('ExpoUpdates');
let rawUpdatesManifest = null;
// If expo-updates defines a non-empty manifest, prefer that one
if (ExpoUpdates) {
    let updatesManifest;
    if (ExpoUpdates.manifest) {
        updatesManifest = ExpoUpdates.manifest;
    }
    else if (ExpoUpdates.manifestString) {
        updatesManifest = JSON.parse(ExpoUpdates.manifestString);
    }
    if (updatesManifest && Object.keys(updatesManifest).length > 0) {
        rawUpdatesManifest = updatesManifest;
    }
}
// If dev-launcher defines a non-empty manifest, prefer that one
let rawDevLauncherManifest = null;
if (NativeModules.EXDevLauncher) {
    let devLauncherManifest;
    if (NativeModules.EXDevLauncher.manifestString) {
        devLauncherManifest = JSON.parse(NativeModules.EXDevLauncher.manifestString);
    }
    if (devLauncherManifest && Object.keys(devLauncherManifest).length > 0) {
        rawDevLauncherManifest = devLauncherManifest;
    }
}
// Fall back to ExponentConstants.manifest if we don't have one from Updates
let rawAppConfig = null;
if (ExponentConstants && ExponentConstants.manifest) {
    const appConfig = ExponentConstants.manifest;
    // On Android we pass the manifest in JSON form so this step is necessary
    if (typeof appConfig === 'string') {
        rawAppConfig = JSON.parse(appConfig);
    }
    else {
        rawAppConfig = appConfig;
    }
}
let rawManifest = rawUpdatesManifest ?? rawDevLauncherManifest ?? rawAppConfig;
const { name, appOwnership, ...nativeConstants } = (ExponentConstants || {});
const constants = {
    ...nativeConstants,
    // Ensure this is null in bare workflow
    appOwnership: appOwnership ?? null,
};
Object.defineProperties(constants, {
    /**
     * Use `manifest` property by default.
     * This property is only used for internal purposes.
     * It behaves similarly to the original one, but suppresses warning upon no manifest available.
     * `expo-asset` uses it to prevent users from seeing mentioned warning.
     */
    __unsafeNoWarnManifest: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    __unsafeNoWarnManifest2: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    manifest: {
        get() {
            const maybeManifest = getManifest();
            if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    manifest2: {
        get() {
            const maybeManifest = getManifest();
            if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    expoConfig: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest) {
                return null;
            }
            // if running an embedded update, maybeManifest is a EmbeddedManifest which doesn't have
            // the expo config. Instead, the embedded expo-constants app.config should be used.
            if (ExpoUpdates && ExpoUpdates.isEmbeddedLaunch) {
                return rawAppConfig;
            }
            if (isExpoUpdatesManifest(maybeManifest)) {
                return maybeManifest.extra?.expoClient ?? null;
            }
            else if (isEmbeddedManifest(maybeManifest)) {
                return maybeManifest;
            }
            return null;
        },
        enumerable: true,
    },
    expoGoConfig: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest) {
                return null;
            }
            if (isExpoUpdatesManifest(maybeManifest)) {
                return maybeManifest.extra?.expoGo ?? null;
            }
            else if (isEmbeddedManifest(maybeManifest)) {
                return maybeManifest;
            }
            return null;
        },
        enumerable: true,
    },
    easConfig: {
        get() {
            const maybeManifest = getManifest(true);
            if (!maybeManifest) {
                return null;
            }
            if (isExpoUpdatesManifest(maybeManifest)) {
                return maybeManifest.extra?.eas ?? null;
            }
            else if (isEmbeddedManifest(maybeManifest)) {
                return maybeManifest;
            }
            return null;
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
function isEmbeddedManifest(manifest) {
    return !isExpoUpdatesManifest(manifest);
}
function isExpoUpdatesManifest(manifest) {
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