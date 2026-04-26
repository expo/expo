import type { BuildConfiguration, ModuleXCFramework } from './types';
/**
 * Scans `ios/Pods/` for prebuilt xcframeworks installed by autolinking when
 * `EXPO_USE_PRECOMPILED_MODULES=1` is set. A pod is "precompiled" when its directory contains
 * a `<Product>.xcframework/` dir and an `artifacts/<Product>-{debug,release}.tar.gz` tarball —
 * the exact signature written by `Expo::PrecompiledModules.ensure_artifacts` in
 * expo-modules-autolinking.
 *
 * For each precompiled pod we yield ALL xcframework subdirs, not just the main product, so
 * that SPM-dependency xcframeworks bundled alongside (e.g. SDWebImage / SDWebImageSVGCoder /
 * libavif laid down inside `Pods/ExpoImage/`) are surfaced too. Without these, the resulting
 * Swift Package would link against missing rpath entries at runtime
 * (`Library not loaded: @rpath/SDWebImage.framework/SDWebImage`).
 *
 * Results are deduplicated by xcframework basename — when the same SPM dep is claimed by
 * multiple pods, only the first one wins (subsequent pods reference it via FRAMEWORK_SEARCH_PATHS
 * in CocoaPods land, so we only need one copy in the SPM output).
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
/**
 * Walks up from `startDir` looking for `packages/precompile/.build/.spm-deps/`. The Expo monorepo
 * stages shared SPM-dependency xcframeworks (SDWebImage, libavif, lottie-ios, …) under that path
 * — one xcframework per `<productName>/<flavor>/`. Returns the absolute path or null.
 */
export declare const findSpmDepsRoot: (startDir: string) => string | null;
/**
 * Scans the monorepo `.spm-deps/` cache for prebuilt SPM-dependency xcframeworks matching the
 * requested build configuration. Each matching `<name>/<flavor>/<name>.xcframework` becomes a
 * `ModuleXCFramework` entry (with `mainProduct === name` since they have no parent pod).
 *
 * `existingNames` is the set of xcframework names already produced by the regular pod-scan
 * enumeration; matching entries here are skipped to avoid duplicate binary targets.
 *
 * Returns an empty array when the `.spm-deps/` cache can't be located (e.g. external users
 * outside the monorepo). Callers should treat that as a soft failure and warn that runtime
 * @rpath references for SPM deps may go unresolved.
 */
export declare const enumerateSpmDepsXcframeworks: (cwd: string, buildConfiguration: BuildConfiguration, existingNames: Set<string>) => ModuleXCFramework[];
