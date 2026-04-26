import type { BuildConfiguration, ModuleXCFramework } from './types';
/**
 * Scans `ios/Pods/` for Expo modules that were installed as prebuilt xcframeworks (i.e. pod
 * install ran with `EXPO_USE_PRECOMPILED_MODULES=1`). A pod is identified as "precompiled"
 * when its directory contains both a `<Product>.xcframework/` dir and an
 * `artifacts/<Product>-{debug,release}.tar.gz` tarball — the exact signature written by
 * `Expo::PrecompiledModules.ensure_artifacts` in expo-modules-autolinking.
 */
export declare const enumeratePrecompiledModules: (iosDir: string) => ModuleXCFramework[];
/**
 * Reads `<podDir>/artifacts/.last_build_configuration` and, if it doesn't match the requested
 * build configuration, shells out to autolinking's `replace-xcframework.js` to extract the
 * correct flavor tarball in place. This protects against the user having run
 * `EXPO_PRECOMPILED_FLAVOR=debug pod install` but then asking for a `--release` brownfield
 * build (or vice-versa).
 */
export declare const ensureCorrectFlavor: (module: ModuleXCFramework, buildConfiguration: BuildConfiguration, options: {
    verbose: boolean;
}) => Promise<void>;
export declare const resolvedFixedXCFrameworks: () => string[];
