"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CLIError {
    static errorSymbol = '✖';
    static errorMessages = {
        'android-task-repo': 'At least one task or repository must be specified',
        'android-directory-not-found': 'Cannot find `android` directory in the project',
        'android-library-unknown-error': 'Unknown error occurred while finding brownfield library',
        'android-library-not-found': 'Could not find brownfield library in the project',
        'ios-artifacts-directory-unknown-error': 'Unknown error occurred while creating artifacts directory',
        'ios-directory-not-found': 'Cannot find `ios` directory in the project',
        'ios-directory-unknown-error': 'Unknown error occurred while finding brownfield iOS scheme',
        'ios-hermes-framework-not-found': 'Could not find hermes framework in the project at path',
        'ios-prebuilds-spm-dep-missing': "Could not find a prebuilt xcframework for an SPM dependency declared by an Expo module. The brownfield Swift Package would ship without it, causing `Library not loaded: @rpath/...` at runtime in the host app. Either re-install the affected Expo module from a release published with bundled SPM deps (`bundleSharedDeps: true`), populate the monorepo's `packages/precompile/.build/.spm-deps/` cache, or set `EXPO_PRECOMPILED_MODULES_PATH` to a directory that contains `.spm-deps/<dep>/<flavor>/<dep>.xcframework`.",
        'ios-scheme-not-found': 'Could not find brownfield iOS scheme',
        'ios-workspace-not-found': 'Could not find brownfield iOS workspace',
        'ios-workspace-unknown-error': 'Unknown error occurred while finding brownfield iOS workspace',
        'package-not-installed': 'expo-brownfield is not installed in the project. Install it with `npx expo install expo-brownfield`',
        'plugin-not-configured': 'expo-brownfield is not configured as a plugin. Add it to the `plugins` array in your app config',
        'prebuild-cancelled': 'Brownfield cannot be built without prebuilding the native project',
    };
    static handle(error, errorMessage = '', fatal = true) {
        const message = errorMessage
            ? `${this.errorMessages[error]}: ${errorMessage}`
            : this.errorMessages[error];
        this.handleInternal(message, fatal);
    }
    static handleInternal(message, fatal = true) {
        console.error(`${this.errorSymbol} Error: ${message}`);
        if (fatal) {
            process.exit(1);
        }
    }
}
exports.default = CLIError;
//# sourceMappingURL=error.js.map