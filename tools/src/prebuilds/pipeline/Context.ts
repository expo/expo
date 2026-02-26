/**
 * Request / context objects for the prebuild pipeline.
 *
 * - `PrebuildCliOptions`  — raw CLI flags (moved from PrebuildPackages.ts)
 * - `PrebuildRequest`     — immutable, normalized intent derived from CLI options
 * - `PrebuildContext`     — mutable runtime state threaded through every step
 */
import type { DownloadedDependencies } from '../Artifacts.types';
import type { SPMPackageSource } from '../ExternalPackage';
import type { SigningOptions } from '../Frameworks';
import type { SPMProduct } from '../SPMConfig.types';
import { BuildFlavor, BuildPlatform } from '../index';
import type { UnitError, UnitStatus } from './Types';

// ---------------------------------------------------------------------------
// CLI options (moved here from PrebuildPackages.ts)
// ---------------------------------------------------------------------------

export type PrebuildCliOptions = {
  reactNativeVersion?: string;
  hermesVersion: string;
  clean: boolean;
  cleanCache: boolean;
  flavor?: BuildFlavor;
  localReactNativeTarball?: string;
  localHermesTarball?: string;
  localReactNativeDepsTarball?: string;
  skipGenerate: boolean;
  skipArtifacts: boolean;
  skipBuild: boolean;
  skipCompose: boolean;
  skipVerify: boolean;
  product?: string;
  platform?: BuildPlatform;
  includeExternal?: boolean;
  sign?: string;
  noTimestamp?: boolean;
  verbose: boolean;
};

// ---------------------------------------------------------------------------
// Immutable request (normalized from CLI options)
// ---------------------------------------------------------------------------

export interface PrebuildRequest {
  readonly packageNames: string[];
  readonly buildFlavors: BuildFlavor[];
  readonly clean: boolean;
  readonly cleanCache: boolean;
  readonly skipGenerate: boolean;
  readonly skipArtifacts: boolean;
  readonly skipBuild: boolean;
  readonly skipCompose: boolean;
  readonly skipVerify: boolean;
  readonly productFilter?: string;
  readonly platformFilter?: BuildPlatform;
  readonly includeExternal: boolean;
  readonly signing?: SigningOptions;
  readonly verbose: boolean;
  readonly localTarballTemplates: {
    readonly reactNative?: string;
    readonly hermes?: string;
    readonly reactNativeDependencies?: string;
  };
  readonly reactNativeVersionOverride?: string;
  readonly hermesVersionOverride: string;
}

// ---------------------------------------------------------------------------
// Mutable runtime context
// ---------------------------------------------------------------------------

export interface PrebuildContext {
  readonly request: PrebuildRequest;

  // Populated by prepare:inputs
  packages: SPMPackageSource[];
  reactNativeVersion: string;
  hermesVersion: string;
  artifactsPath: string;

  // Downloaded artifacts, keyed by flavor (populated lazily during execution)
  artifactsByFlavor: Map<BuildFlavor, DownloadedDependencies | null>;

  // Iteration pointers (set by Executor before each step)
  currentPackage: SPMPackageSource | null;
  currentProduct: SPMProduct | null;
  currentFlavor: BuildFlavor | null;

  // Accumulation
  statuses: UnitStatus[];
  errors: UnitError[];

  // Cancellation
  cancelled: boolean;
}

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function createRequest(
  packageNames: string[],
  options: PrebuildCliOptions
): PrebuildRequest {
  const signing: SigningOptions | undefined = options.sign
    ? { identity: options.sign, useTimestamp: !options.noTimestamp }
    : undefined;

  return {
    packageNames,
    buildFlavors: options.flavor ? [options.flavor] : ['Debug', 'Release'],
    clean: options.clean,
    cleanCache: options.cleanCache,
    skipGenerate: options.skipGenerate,
    skipArtifacts: options.skipArtifacts,
    skipBuild: options.skipBuild,
    skipCompose: options.skipCompose,
    skipVerify: options.skipVerify,
    productFilter: options.product,
    platformFilter: options.platform,
    includeExternal: options.includeExternal ?? false,
    signing,
    verbose: options.verbose,
    localTarballTemplates: {
      reactNative: options.localReactNativeTarball,
      hermes: options.localHermesTarball,
      reactNativeDependencies: options.localReactNativeDepsTarball,
    },
    reactNativeVersionOverride: options.reactNativeVersion,
    hermesVersionOverride: options.hermesVersion,
  };
}

export function createContext(request: PrebuildRequest): PrebuildContext {
  return {
    request,
    packages: [],
    reactNativeVersion: '',
    hermesVersion: '',
    artifactsPath: '',
    artifactsByFlavor: new Map(),
    currentPackage: null,
    currentProduct: null,
    currentFlavor: null,
    statuses: [],
    errors: [],
    cancelled: false,
  };
}
