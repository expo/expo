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
        'ios-prebuilds-not-found': 'No precompiled Expo module xcframeworks found in `ios/Pods/`. Re-run `npx expo prebuild` with the `usePrebuilds` plugin prop enabled, or run `EXPO_USE_PRECOMPILED_MODULES=1 pod install` inside `ios/`. See https://docs.expo.dev/guides/precompiled-modules/.',
        'ios-prebuilds-require-swift-package': '`--use-prebuilds` requires `--package` because prebuilt Expo module xcframeworks are only shipped via the Swift Package output. Re-run with `--package [name]`.',
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