import { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants.web.js';
export { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, };
// Fall back to ExponentConstants.manifest if we don't have one from Updates
let rawAppConfig = null;
if (ExponentConstants?.manifest) {
    const appConfig = ExponentConstants.manifest;
    // On Android we pass the manifest in JSON form so this step is necessary
    if (typeof appConfig === 'string') {
        rawAppConfig = JSON.parse(appConfig);
    }
    else {
        rawAppConfig = appConfig;
    }
}
let rawManifest = rawAppConfig;
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
            const maybeManifest = rawManifest;
            if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    __unsafeNoWarnManifest2: {
        get() {
            const maybeManifest = rawManifest;
            if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: false,
    },
    manifest: {
        get() {
            const maybeManifest = rawManifest;
            if (!maybeManifest || !isEmbeddedManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    manifest2: {
        get() {
            const maybeManifest = rawManifest;
            if (!maybeManifest || !isExpoUpdatesManifest(maybeManifest)) {
                return null;
            }
            return maybeManifest;
        },
        enumerable: true,
    },
    expoConfig: {
        get() {
            const maybeManifest = rawManifest;
            if (!maybeManifest) {
                return null;
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
            const maybeManifest = rawManifest;
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
            const maybeManifest = rawManifest;
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
    return true;
}
function isExpoUpdatesManifest(manifest) {
    return false;
}
export default constants;
//# sourceMappingURL=Constants.server.js.map