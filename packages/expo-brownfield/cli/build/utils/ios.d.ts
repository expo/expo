import spawnAsync from '@expo/spawn-async';
import type { IosConfig } from './types';
/**
 * Inspect the built brownfield framework binary and return the names of `@rpath`-linked
 * dynamic frameworks that are NOT already covered by the fixed XCFramework set, the
 * brownfield target itself, or precompiled-module enumeration.
 *
 * Source-built pods (e.g. `ExpoModulesJSI` from a local podspec) are produced as dynamic
 * `.framework`s alongside the brownfield framework, and the brownfield binary holds an
 * `@rpath/<X>.framework/<X>` reference to each. Without shipping these as standalone
 * xcframeworks the host app crashes at runtime with `dyld: Library not loaded: @rpath/…`.
 *
 * Returns names without the `.framework` suffix, deduped, in `otool -L` order.
 */
export declare const enumerateSourceBuiltDeps: (config: IosConfig, alreadyCovered: Set<string>) => Promise<string[]>;
export declare const cleanUpArtifacts: (config: IosConfig) => Promise<void>;
export declare const buildFramework: (config: IosConfig) => Promise<spawnAsync.SpawnResult | undefined>;
export declare const copyXCFrameworks: (config: IosConfig, dest: string) => Promise<void>;
export declare const createSwiftPackage: (config: IosConfig) => Promise<string>;
export declare const createXCframework: (config: IosConfig, at: string) => Promise<spawnAsync.SpawnResult | undefined>;
export declare const findScheme: () => string | undefined;
export declare const findWorkspace: (dryRun: boolean) => string | undefined;
export declare const generatePackageMetadataFile: (config: IosConfig, packagePath: string) => Promise<void>;
export declare const getSupportedPlatforms: (config: IosConfig) => Promise<string[]>;
export declare const libraryProduct: (name: string, targets: string[]) => string;
export declare const binaryTarget: (name: string) => string;
export declare const makeArtifactsDirectory: (config: IosConfig) => void;
export declare const printIosConfig: (config: IosConfig) => void;
/**
 * Diagnostics for `hostProvidedFrameworks`. Run before the build kicks off so any misconfiguration
 * surfaces with a clear message instead of a confusing "Multiple commands produce" / runtime crash:
 *
 *  - **Source-build guardrail:** when `usePrebuilds` is false there is no separate xcframework to
 *    strip — the host pod gets statically linked into the brownfield framework itself. We fail
 *    fast and point the user at the docs.
 *  - **Unused-entry warning:** a name listed in `hostProvidedFrameworks` that doesn't match any
 *    actual xcframework discovered across the three resolution layers (pod scan, npm-bundled
 *    `prebuilds/output/`, shared `.spm-deps/`) indicates a typo or stale config — warn so the
 *    user catches it before debugging a still-duplicated build.
 *  - **Version log:** for each excluded framework we surface the `CFBundleShortVersionString`
 *    found in its bundled `Info.plist`. The consumer's host app must ship a version that's ABI-
 *    compatible with what we just stripped; logging the expected version here gives them a
 *    concrete target to verify against.
 */
export declare const validateHostProvided: (config: IosConfig) => void;
export declare const shipFrameworks: (config: IosConfig) => Promise<void>;
export declare const shipSwiftPackage: (config: IosConfig) => Promise<void>;
