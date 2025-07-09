import { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, } from './Constants.types';
import ExponentConstants from './ExponentConstants.web.js';
export { AppOwnership, ExecutionEnvironment, UserInterfaceIdiom, };
const PARSED_MANIFEST = (() => {
    if (typeof ExponentConstants?.manifest === 'string') {
        return JSON.parse(ExponentConstants.manifest);
    }
    return ExponentConstants?.manifest;
})();
const constants = ExponentConstants;
Object.defineProperties(constants, {
    /**
     * Use `manifest` property by default.
     * This property is only used for internal purposes.
     * It behaves similarly to the original one, but suppresses warning upon no manifest available.
     * `expo-asset` uses it to prevent users from seeing mentioned warning.
     */
    __unsafeNoWarnManifest: {
        get() {
            return PARSED_MANIFEST;
        },
        enumerable: false,
    },
    manifest: {
        get() {
            return PARSED_MANIFEST;
        },
        enumerable: true,
    },
    expoConfig: {
        get() {
            return PARSED_MANIFEST;
        },
        enumerable: true,
    },
    expoGoConfig: {
        get() {
            return PARSED_MANIFEST;
        },
        enumerable: true,
    },
    easConfig: {
        get() {
            return PARSED_MANIFEST;
        },
        enumerable: true,
    },
});
export default constants;
//# sourceMappingURL=Constants.server.js.map