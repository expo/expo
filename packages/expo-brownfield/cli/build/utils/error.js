"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CLIError {
    static errorSymbol = '✖';
    static errorMessages = {
        'android-task-repo': 'At least one task or repository must be specified. The app config declares no local Maven repositories to default to, and remote repositories are never published to implicitly — pass `--repo <name>` or `-t <gradle task>` explicitly.',
        'android-directory-not-found': 'Cannot find `android` directory in the project',
        'android-library-unknown-error': 'Unknown error occurred while finding brownfield library',
        'android-library-not-found': 'Could not find brownfield library in the project',
        'ios-artifacts-directory-unknown-error': 'Unknown error occurred while creating artifacts directory',
        'ios-directory-not-found': 'Cannot find `ios` directory in the project',
        'ios-directory-unknown-error': 'Unknown error occurred while finding brownfield iOS scheme',
        'ios-framework-not-found': 'Could not find the compiled brownfield framework in the Xcode build products directory (checked the products root and XCFrameworkIntermediates/). This usually means the xcodebuild step failed or built a different scheme than expected. Re-run with --verbose to inspect the build log, and confirm the scheme name matches `ios.targetName` in your expo-brownfield plugin config. Missing framework',
        'ios-hermes-framework-not-found': 'Could not find hermes framework in the project at path',
        'ios-host-provided-without-prebuilds': 'ios.hostProvidedFrameworks is set but precompiled modules are not enabled. Without precompiled modules, third-party pods (like SDWebImage) are statically linked into the brownfield framework itself, so there is no separate xcframework to strip. Enable `ios.usePrecompiledModules: true` in expo-build-properties (run `pod install` afterwards), or remove ios.hostProvidedFrameworks from the expo-brownfield plugin config.',
        'ios-pod-install-cancelled': 'Brownfield cannot be built without installing CocoaPods. Run `pod install` in the `ios/` and try again.',
        'ios-prebuilds-spm-dep-flavor-mismatch': 'A shared SPM dependency xcframework is only available in a different build flavor than the requested one. Bundling it would mix debug and release binaries in the brownfield package. Re-run `pod install` with `EXPO_PRECOMPILED_FLAVOR` set to the requested flavor, run the precompile prebuild pipeline for that flavor, or ensure the consuming npm package ships `prebuilds/spm-deps/<dep>/<flavor>/<dep>.xcframework`. Mismatched dependency',
        'ios-prebuilds-spm-dep-missing': "Could not find a prebuilt xcframework for an SPM dependency declared by an Expo module. The brownfield Swift Package would ship without it, causing `Library not loaded: @rpath/...` at runtime in the host app. Either re-install the affected Expo module from a release published with bundled SPM deps (`bundleSharedDeps: true`), populate the monorepo's `packages/precompile/.build/.spm-deps/` cache, or set `EXPO_PRECOMPILED_MODULES_PATH` to a directory that contains `.spm-deps/<dep>/<flavor>/<dep>.xcframework`.",
        'ios-scheme-name-collision': 'The brownfield target name collides with the name of a framework bundled into the package. The bundled module xcframework would overwrite the brownfield wrapper framework of the same name, producing a package that is missing the wrapper classes (e.g. `ReactNativeHostManager`). Rename `ios.targetName` in the expo-brownfield plugin config to a unique name (e.g. `MyAppKit`), run `npx expo prebuild --clean`, and build again. Colliding name',
        'ios-scheme-not-found': 'Could not find brownfield iOS scheme',
        'ios-workspace-not-found': 'Could not find a brownfield iOS workspace (`.xcworkspace`) in the `ios/` directory. This usually means `pod install` has not been run yet. Run `pod install` and try again.',
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