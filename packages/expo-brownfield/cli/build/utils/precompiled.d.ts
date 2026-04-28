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
 * Locates the shared SPM-deps cache root. Resolution order:
 *
 *  1. `$EXPO_PRECOMPILED_MODULES_PATH/.spm-deps/` — explicit override matching the Ruby
 *     autolinking convention (precompiled_modules.rb's MODULES_PATH_ENV_VAR).
 *  2. Walk up from `startDir` looking for `packages/precompile/.build/.spm-deps/` — the Expo
 *     monorepo's centralized cache.
 *
 * Returns the absolute path to the `.spm-deps/` dir, or null when neither is reachable.
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
/**
 * Subset of the `spm.config.json` schema we actually care about for resolving deps. Each
 * Expo precompiled module ships one of these (e.g. `node_modules/expo-image/spm.config.json`).
 */
export interface SpmConfig {
    products?: SpmProduct[];
}
export interface SpmProduct {
    name?: string;
    podName?: string;
    spmPackages?: SpmPackageEntry[];
}
export interface SpmPackageEntry {
    productName?: string;
    url?: string;
}
export interface NpmPackageInfo {
    npmPackage: string;
    packageRoot: string;
    spmConfig: SpmConfig;
}
/**
 * Builds a `Map<podName, NpmPackageInfo>` for every npm package reachable from `cwd` that has
 * an `spm.config.json` declaring a `podName`. Used to walk an enumerated pod (e.g. `ExpoImage`)
 * back to its npm package so we can read its declared `spmPackages`.
 *
 * Two scan passes:
 *  1. `<cwd>/node_modules/{*,@scope/*}/spm.config.json` — packages that ship their own config.
 *  2. `<expo-modules-autolinking>/external-configs/ios/{*,@scope/*}/spm.config.json` — third-party
 *     packages (RNReanimated, RNScreens, RNSkia, …) whose configs live in the autolinking
 *     package rather than alongside their own source.
 *
 * The node_modules pass runs first so a workspace-installed `spm.config.json` always wins over
 * the bundled external default. Each candidate is `realpath`'d for pnpm's `.pnpm/` store layout.
 */
export declare const buildPodToNpmPackageMap: (cwd: string) => Map<string, NpmPackageInfo>;
/**
 * Returns the unique set of declared SPM-dep product names across the given pods, looked up
 * via each pod's npm package's `spm.config.json`. Used both as the source-of-truth completeness
 * check and as the input to bundled-dep enumeration.
 */
export declare const collectDeclaredSpmDeps: (modules: ModuleXCFramework[], podToNpm: Map<string, NpmPackageInfo>) => {
    name: string;
    declaringPod: string;
}[];
/**
 * For each enumerated pod, walk back to its npm package, read declared `spmPackages`, and look
 * for a matching `<name>.xcframework` under that package's `prebuilds/output/.../<flavor>/`
 * tree. This is the npm-published consumer path — the precompile pipeline's `bundleSharedDeps`
 * mode drops the SPM-dep xcframeworks alongside the main product when publishing, so external
 * (non-monorepo) users have everything they need locally without any shared cache.
 *
 * Skips entries already in `existingNames` (pod-scan layer wins over bundled). Silently omits
 * deps whose xcframework can't be found here — the strict completeness check downstream
 * (in copyXCFrameworks) is the source of truth for surfacing unresolvable deps.
 */
export declare const enumerateBundledSpmDepsXcframeworks: (modules: ModuleXCFramework[], podToNpm: Map<string, NpmPackageInfo>, buildConfiguration: BuildConfiguration, existingNames: Set<string>) => ModuleXCFramework[];
/**
 * Single source of truth for the full prebuild module set. Walks all three layers in priority
 * order (pod → bundled-npm → shared `.spm-deps/`), deduping by xcframework name across layers,
 * and runs the strict completeness check before returning.
 *
 * Both `copyXCFrameworks` (bundles xcframeworks into the package) and `generatePackageMetadataFile`
 * (declares them in `Package.swift`) need to see the exact same module set, otherwise an
 * xcframework can land on disk without a matching `.binaryTarget` (or vice-versa). Calling this
 * helper from both sites guarantees they agree, and gates both behind the completeness check
 * so we never produce a half-baked package on missing deps.
 */
export declare const enumerateAllPrebuildModules: (cwd: string, buildConfiguration: BuildConfiguration) => ModuleXCFramework[];
