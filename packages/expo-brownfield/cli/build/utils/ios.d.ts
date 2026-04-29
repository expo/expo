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
export declare const enumerateSourceBuiltDeps: (config: IosConfig, alreadyCovered: Set<string>) => string[];
export declare const cleanUpArtifacts: (config: IosConfig) => Promise<void>;
export declare const buildFramework: (config: IosConfig) => Promise<import("./types").RunCommandResult | undefined>;
export declare const copyXCFrameworks: (config: IosConfig, dest: string) => Promise<void>;
export declare const createSwiftPackage: (config: IosConfig) => Promise<string>;
export declare const createXCframework: (config: IosConfig, at: string) => Promise<import("./types").RunCommandResult | undefined>;
export declare const findScheme: () => string | undefined;
export declare const findWorkspace: (dryRun: boolean) => string | undefined;
export declare const generatePackageMetadataFile: (config: IosConfig, packagePath: string) => Promise<void>;
export declare const getSupportedPlatforms: (config: IosConfig) => Promise<string[]>;
export declare const libraryProduct: (name: string, targets: string[]) => string;
export declare const binaryTarget: (name: string) => string;
export declare const makeArtifactsDirectory: (config: IosConfig) => void;
export declare const printIosConfig: (config: IosConfig) => void;
export declare const shipFrameworks: (config: IosConfig) => Promise<void>;
export declare const shipSwiftPackage: (config: IosConfig) => Promise<void>;
