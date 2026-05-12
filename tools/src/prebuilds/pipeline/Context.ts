/**
 * Request / context objects for the prebuild pipeline.
 *
 * - `PrebuildCliOptions`  — raw CLI flags (moved from PrebuildPackages.ts)
 * - `PrebuildRequest`     — immutable, normalized intent derived from CLI options
 * - `PrebuildContext`     — mutable runtime state threaded through every step
 */
import os from 'os';

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
  hermesVersion?: string;
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
  externalOnly?: boolean;
  sign?: string;
  noTimestamp?: boolean;
  verbose: boolean;
  concurrency?: number;
  bundleSharedDeps?: boolean;
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
  readonly externalOnly: boolean;
  readonly signing?: SigningOptions;
  readonly verbose: boolean;
  readonly bundleSharedDeps: boolean;
  readonly localTarballTemplates: {
    readonly reactNative?: string;
    readonly hermes?: string;
    readonly reactNativeDependencies?: string;
  };
  readonly reactNativeVersionOverride?: string;
  readonly hermesVersionOverride?: string;
  readonly concurrency: number;
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

  // Dependency graph: packageName -> set of packageNames it depends on
  // Populated by prepare:inputs (sortPackagesByDependencies)
  dependsOn: Map<string, Set<string>>;

  // Downloaded artifacts, keyed by flavor (populated lazily during execution)
  artifactsByFlavor: Map<BuildFlavor, DownloadedDependencies | null>;

  // Tracks customBuild products that have been built during this run, so we
  // only invoke their scripts once even when iterating multiple flavors.
  // Keys are `${packageName}/${productName}`.
  customBuiltProducts: Set<string>;

  // Iteration pointers (set by Executor before each step)
  currentPackage: SPMPackageSource | null;
  currentProduct: SPMProduct | null;
  currentFlavor: BuildFlavor | null;

  // Accumulation
  statuses: UnitStatus[];
  errors: UnitError[];

  // Cancellation
  cancelled: boolean;
  abortController: AbortController;

  // When true, skip writing the error log file (used in tests)
  suppressErrorLog?: boolean;
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
    includeExternal: !!(options.includeExternal || options.externalOnly),
    externalOnly: options.externalOnly ?? false,
    signing,
    verbose: options.verbose,
    localTarballTemplates: {
      reactNative: options.localReactNativeTarball,
      hermes: options.localHermesTarball,
      reactNativeDependencies: options.localReactNativeDepsTarball,
    },
    reactNativeVersionOverride: options.reactNativeVersion,
    hermesVersionOverride: options.hermesVersion,
    bundleSharedDeps: options.bundleSharedDeps ?? false,
    concurrency: options.concurrency ?? Math.ceil(os.cpus().length / 3),
  };
}

export function createContext(request: PrebuildRequest): PrebuildContext {
  return {
    request,
    packages: [],
    reactNativeVersion: '',
    hermesVersion: '',
    artifactsPath: '',
    dependsOn: new Map(),
    artifactsByFlavor: new Map(),
    customBuiltProducts: new Set(),
    currentPackage: null,
    currentProduct: null,
    currentFlavor: null,
    statuses: [],
    errors: [],
    cancelled: false,
    abortController: new AbortController(),
  };
}
