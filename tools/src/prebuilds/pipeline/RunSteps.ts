/**
 * Run-scope pipeline steps: validation, discovery, and cache cleaning.
 *
 * Also hosts helper functions moved from PrebuildPackages.ts:
 *  - sortPackagesByDependencies
 *  - expandWithUnbuiltDependencies
 *  - resolveFlavorTemplatedPath
 *  - CACHE_DEPS
 */
import chalk from 'chalk';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { PACKAGES_DIR } from '../../Constants';
import logger from '../../Logger';
import { getPackageByName } from '../../Packages';
import { getBundledVersionsAsync } from '../../ProjectVersions';
import { Artifacts } from '../Artifacts';
import { Dependencies } from '../Dependencies';
import type { SPMPackageSource } from '../ExternalPackage';
import { getExternalPackageByProductName, isExternalPackage } from '../ExternalPackage';
import { Frameworks } from '../Frameworks';
import type { BuildFlavor } from '../Prebuilder.types';
import { buildSharedSPMDependencyAsync } from '../SPMBuild';
import type { SPMPackageDependencyConfig, SPMProduct, SPMTarget } from '../SPMConfig.types';
import {
  getVersionsInfoAsync,
  setForceNonInteractive,
  validateAllPodNamesAsync,
  verifyAllPackagesAsync,
  verifyLocalTarballPathsIfSetAsync,
} from '../Utils';
import { resolveInstalledPackage } from '../resolvePackage';
import type { PrebuildContext } from './Context';
import type { Step } from './Types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Standard external dependencies that come from the cache (not from other packages).
 */
export const CACHE_DEPS = new Set(['ReactNativeDependencies', 'React', 'Hermes']);

// ---------------------------------------------------------------------------
// Helper: rebindExternalPackagesToBundledVersions
// ---------------------------------------------------------------------------

/**
 * Rebinds each external package's `path` / `packageVersion` to the install in
 * any monorepo workspace whose version satisfies `packages/expo/bundledNativeModules.json`
 * — the canonical SDK manifest end users resolve against via `expo install`.
 * Packages absent from the bundled map are left untouched. Throws when a
 * bundled-listed package has no satisfying install anywhere in the workspace.
 */
export function rebindExternalPackagesToBundledVersions(
  externalPackages: SPMPackageSource[],
  bundledNativeModules: Record<string, string>,
  resolve: (name: string, range: string) => { path: string; version: string } | null
): void {
  for (const pkg of externalPackages) {
    const range = bundledNativeModules[pkg.packageName];
    if (!range) continue;
    const resolved = resolve(pkg.packageName, range);
    if (!resolved) {
      throw new Error(
        `No installed version of "${pkg.packageName}" in the monorepo satisfies ${range} ` +
          `(from packages/expo/bundledNativeModules.json — the canonical SDK manifest for ` +
          `"expo install" and create-expo templates). Without a satisfying install, the ` +
          `prebuilt XCFramework would be invisible to precompiled_modules.rb at end-user ` +
          `pod install. Fix: add "${pkg.packageName}" to some workspace at a version ` +
          `satisfying ${range} and run "pnpm install".`
      );
    }
    pkg.path = resolved.path;
    pkg.packageVersion = resolved.version;
  }
}

// ---------------------------------------------------------------------------
// Helper: resolveFlavorTemplatedPath
// ---------------------------------------------------------------------------

/**
 * Resolves a local tarball path, substituting `{flavor}` with the current build flavor.
 * If the path contains no `{flavor}` placeholder, it is used as-is.
 */
export function resolveFlavorTemplatedPath(
  templatePath: string | undefined,
  flavor: BuildFlavor
): string | undefined {
  if (!templatePath) {
    return undefined;
  }
  return templatePath.replace(/\{flavor\}/gi, flavor);
}

// ---------------------------------------------------------------------------
// Helper: sortPackagesByDependencies
// ---------------------------------------------------------------------------

export interface TopologicalSortResult {
  sorted: SPMPackageSource[];
  /** packageName → set of packageNames it depends on (within the build set) */
  dependsOn: Map<string, Set<string>>;
}

/**
 * Sorts packages in topological order based on their externalDependencies.
 * Packages with no dependencies come first, followed by packages that depend on them.
 * Also returns the dependency map for use by the parallel scheduler.
 */
export function sortPackagesByDependencies(packages: SPMPackageSource[]): TopologicalSortResult {
  // Build a map of package name -> Package
  const packageMap = new Map<string, SPMPackageSource>();
  for (const pkg of packages) {
    packageMap.set(pkg.packageName, pkg);
  }

  // Build a map of product name -> package name
  // This is needed because external packages reference each other by product name
  // (e.g., "RNWorklets") rather than package name (e.g., "react-native-worklets")
  // Source-only products are excluded — they are never built as xcframeworks,
  // so other products cannot depend on them as binary dependencies.
  const productToPackage = new Map<string, string>();
  for (const pkg of packages) {
    try {
      const spmConfig = pkg.getSwiftPMConfiguration();
      for (const product of spmConfig.products) {
        if (product.sourceOnly) continue;
        productToPackage.set(product.name, pkg.packageName);
      }
    } catch {
      // If we can't read the config, skip
    }
  }

  // Build dependency graph: package name -> set of package names it depends on
  const dependsOn = new Map<string, Set<string>>();

  for (const pkg of packages) {
    const deps = new Set<string>();
    try {
      const spmConfig = pkg.getSwiftPMConfiguration();
      for (const product of spmConfig.products) {
        // Source-only products are not built, so their externalDependencies
        // do not influence prebuild ordering.
        if (product.sourceOnly) continue;
        if (product.externalDependencies) {
          for (const dep of product.externalDependencies) {
            // Dependencies can be "package-name" or "package-name/ProductName"
            // or "@scope/package-name/ProductName" or just "ProductName"
            let packageName: string;
            if (dep.includes('/')) {
              // Handle scoped packages: @expo/ui/ExpoUI -> @expo/ui
              const parts = dep.split('/');
              packageName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            } else {
              // Could be a bare product name (e.g., "RNWorklets") or a package name
              // Try to resolve as product name first, fallback to literal
              packageName = productToPackage.get(dep) ?? dep;
            }
            // Only track dependencies that are in our build set, and ignore
            // intra-package product references (a product depending on another
            // product within the same package is not a build-order dependency).
            if (packageMap.has(packageName) && packageName !== pkg.packageName) {
              deps.add(packageName);
            }
          }
        }
      }
    } catch {
      // If we can't read the config, assume no dependencies
    }
    dependsOn.set(pkg.packageName, deps);
  }

  // Topological sort using Kahn's algorithm
  const sorted: SPMPackageSource[] = [];
  const inDegree = new Map<string, number>();

  // Calculate in-degrees (number of dependencies each package has within our build set)
  for (const [name, deps] of dependsOn) {
    inDegree.set(name, deps.size);
  }

  // Find all packages with no dependencies (in-degree 0)
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) {
      queue.push(name);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const name = queue.shift()!;
    const pkg = packageMap.get(name);
    if (pkg) {
      sorted.push(pkg);
    }

    // For each package that depends on this one, decrement its in-degree
    for (const [otherName, deps] of dependsOn) {
      if (deps.has(name)) {
        const newDegree = (inDegree.get(otherName) ?? 1) - 1;
        inDegree.set(otherName, newDegree);
        if (newDegree === 0) {
          queue.push(otherName);
        }
      }
    }
  }

  // If we didn't get all packages, there's a cycle - report it and return original order
  if (sorted.length !== packageMap.size) {
    const sortedNames = new Set(sorted.map((p) => p.packageName));
    const unsortedPackages = [...packageMap.keys()].filter((name) => !sortedNames.has(name));

    logger.warn(`⚠️  Circular dependency detected in packages, building in original order`);
    logger.warn(`   Packages involved in cycle: ${chalk.yellow(unsortedPackages.join(', '))}`);

    for (const pkgName of unsortedPackages) {
      const deps = dependsOn.get(pkgName);
      if (deps && deps.size > 0) {
        const cycleDeps = [...deps].filter((d) => unsortedPackages.includes(d));
        if (cycleDeps.length > 0) {
          logger.warn(
            `   ${chalk.cyan(pkgName)} depends on: ${chalk.yellow(cycleDeps.join(', '))}`
          );
        }
      }
    }

    return { sorted: [...packageMap.values()], dependsOn };
  }

  // Log the build order if it differs from input
  const originalOrder = [...packageMap.keys()].join(', ');
  const sortedOrder = sorted.map((p) => p.packageName).join(', ');
  if (originalOrder !== sortedOrder) {
    logger.info(`📋 Build order (sorted by dependencies):\n${chalk.cyan(sortedOrder)}`);
  }

  return { sorted, dependsOn };
}

// ---------------------------------------------------------------------------
// Helper: dependency framework status
// ---------------------------------------------------------------------------

type DependencyFrameworkStatus =
  | { status: 'fresh' }
  | { status: 'missing'; flavor: BuildFlavor }
  | { status: 'stale'; flavor: BuildFlavor };

function getPathMtimeMs(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    // Unreadable input → force a rebuild rather than silently passing as fresh.
    return Number.POSITIVE_INFINITY;
  }
}

function getFrameworkMtimeMs(frameworkPath: string): number {
  // Info.plist is rewritten on each build; without it the bundle is stale.
  const infoPlistPath = path.join(frameworkPath, 'Info.plist');
  try {
    return fs.statSync(infoPlistPath).mtimeMs;
  } catch {
    return 0;
  }
}

function getSourceTargetPath(pkg: SPMPackageSource, target: SPMTarget): string | null {
  if (target.type === 'framework') {
    return path.resolve(pkg.path, target.path);
  }

  const isBuildArtifact = target.path.startsWith('.build/');
  const targetRoot = isBuildArtifact ? pkg.buildPath : pkg.path;
  const targetPath = isBuildArtifact ? target.path.slice('.build/'.length) : target.path;
  return path.resolve(targetRoot, targetPath);
}

function collectTargetInputPaths(pkg: SPMPackageSource, target: SPMTarget): string[] {
  const targetSourcePath = getSourceTargetPath(pkg, target);
  if (!targetSourcePath || !fs.existsSync(targetSourcePath)) {
    return [];
  }

  if (target.type === 'framework') {
    return [targetSourcePath];
  }

  return glob
    .sync('**/*', {
      cwd: targetSourcePath,
      ignore: target.exclude ?? [],
      nodir: true,
    })
    .map((file) => path.join(targetSourcePath, file));
}

function getNewestProductInputMtimeMs(pkg: SPMPackageSource, product: SPMProduct): number {
  const inputPaths = [
    path.join(pkg.path, 'package.json'),
    path.join(pkg.path, 'spm.config.json'),
    ...product.targets.flatMap((target) => collectTargetInputPaths(pkg, target)),
  ];

  for (const target of product.targets) {
    if (target.type === 'framework') continue;
    for (const resource of target.resources ?? []) {
      for (const file of glob.sync(resource.path, {
        cwd: pkg.path,
        nodir: true,
      })) {
        inputPaths.push(path.join(pkg.path, file));
      }
    }
  }

  return Math.max(...inputPaths.map(getPathMtimeMs));
}

function getDependencyFrameworkStatus(
  pkg: SPMPackageSource,
  product: SPMProduct,
  buildFlavors: BuildFlavor[]
): DependencyFrameworkStatus {
  const newestInputMtimeMs = getNewestProductInputMtimeMs(pkg, product);

  for (const flavor of buildFlavors) {
    const frameworkPath = Frameworks.findFrameworkAtAnyVersion(pkg.buildPath, product.name, flavor);
    if (!frameworkPath) {
      return { status: 'missing', flavor };
    }

    if (getFrameworkMtimeMs(frameworkPath) < newestInputMtimeMs) {
      return { status: 'stale', flavor };
    }
  }

  return { status: 'fresh' };
}

// ---------------------------------------------------------------------------
// Helper: expandWithUnbuiltDependencies
// ---------------------------------------------------------------------------

type DependencyExpansionOptions = {
  buildFlavors?: BuildFlavor[];
  clean?: boolean;
  resolvePackageByName?: (packageName: string) => SPMPackageSource | null;
};

/**
 * Expands the package list to include unbuilt dependencies.
 * When a package depends on another monorepo package (via externalDependencies)
 * and that dependency's xcframework doesn't exist yet, it's automatically added
 * to the build set so the build can succeed without manual intervention.
 */
export function expandWithUnbuiltDependencies(
  packages: SPMPackageSource[],
  options: DependencyExpansionOptions = {}
): SPMPackageSource[] {
  const buildFlavors = options.buildFlavors ?? ['Debug', 'Release'];
  const resolvePackageByName = options.resolvePackageByName ?? getPackageByName;
  const packagesByName = new Map(packages.map((p) => [p.packageName, p]));
  const added = new Map<string, SPMPackageSource>();

  // Iterate until no new packages are discovered
  let changed = true;
  while (changed) {
    changed = false;
    const currentSet = [...packagesByName.values(), ...added.values()];

    for (const pkg of currentSet) {
      let spmConfig;
      try {
        spmConfig = pkg.getSwiftPMConfiguration();
      } catch {
        continue;
      }

      for (const product of spmConfig.products) {
        // Source-only products are never built, so their externalDependencies
        // do not need to be present in the build set.
        if (product.sourceOnly) continue;
        if (!product.externalDependencies) continue;

        for (const dep of product.externalDependencies) {
          let depPackageName: string;
          let depProductName: string;

          if (dep.includes('/')) {
            // Parse package name and product name (handle scoped: @expo/ui/ExpoUI)
            const parts = dep.split('/');
            const isScoped = parts[0].startsWith('@');
            depPackageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
            depProductName = isScoped ? parts[2] : parts[1];
          } else {
            // Bare product name (e.g., "RNWorklets")
            // Resolve to package via external package configs
            const externalPkg = getExternalPackageByProductName(dep);
            if (!externalPkg) continue;
            depPackageName = externalPkg.packageName;
            depProductName = dep;
          }

          // Skip cache deps and deps already in the build set
          if (CACHE_DEPS.has(depPackageName)) continue;
          if (packagesByName.has(depPackageName) || added.has(depPackageName)) continue;

          // Resolve the dep package once — needed for both the customBuild check
          // and the auto-add below.
          const depPkg = resolvePackageByName(depPackageName);
          if (!depPkg) continue;
          let depConfig;
          try {
            depConfig = depPkg.getSwiftPMConfiguration();
          } catch {
            continue;
          }

          // customBuild products own their staleness signal (their build script
          // hashes its own inputs and no-ops on cache hit). Always include them
          // so the script runs and can detect source changes the existence
          // check below cannot.
          const depProduct = depConfig.products.find((p) => p.name === depProductName);
          const isCustomBuild = !!depProduct?.customBuild;

          let reason = 'xcframework not found';

          if (options.clean) {
            reason = 'clean requested';
          } else if (isCustomBuild) {
            reason = 'customBuild — script decides cache';
          } else if (depProduct) {
            const status = getDependencyFrameworkStatus(depPkg, depProduct, buildFlavors);
            if (status.status === 'fresh') continue;

            reason =
              status.status === 'stale'
                ? `${status.flavor} xcframework stale`
                : `${status.flavor} xcframework not found`;
          }

          logger.info(
            `📎 Auto-adding ${chalk.cyan(depPackageName)} (required by ${chalk.green(pkg.packageName)}, ${reason})`
          );
          added.set(depPackageName, depPkg);
          changed = true;
        }
      }
    }
  }

  if (added.size > 0) {
    return [...packages, ...added.values()];
  }
  return packages;
}

// ---------------------------------------------------------------------------
// Run-scope steps
// ---------------------------------------------------------------------------

export const prepareInputsStep: Step<PrebuildContext> = {
  id: 'prepare:inputs',
  scope: 'run',
  label: 'Prepare inputs',
  onError: 'stop-run',

  shouldRun: () => true,

  async run(ctx) {
    const { request } = ctx;

    // Verbose widens what gets logged but doesn't change interactive vs.
    // non-interactive — TTY users can opt into the full per-step trace and
    // still see spinners. CI is non-interactive on its own.
    logger.setVerbose(request.verbose);

    // Force non-interactive when building in parallel — ora spinners from
    // concurrent packages would overwrite each other's terminal lines.
    if (request.concurrency > 1) {
      setForceNonInteractive(true);
    }

    if (request.packageNames.length > 0) {
      logger.info(`📦 Prebuilding packages: ${chalk.green(request.packageNames.join(', '))}`);
    } else if (request.externalOnly) {
      logger.info(`📦 Discovering external packages with spm.config.json...`);
    } else {
      const scope = request.allPackages ? 'all' : 'the default distributed set of';
      const externalNote = request.includeExternal ? ' (including external packages)' : '';
      logger.info(`📦 Discovering ${scope} packages with spm.config.json${externalNote}...`);
    }

    // 1. Verify packages exist and have spm.config.json (or discover the default set)
    const requestedPackages = await verifyAllPackagesAsync(
      request.packageNames,
      request.includeExternal,
      request.externalOnly,
      request.allPackages
    );

    // 2. Auto-add unbuilt dependencies to the build set
    const unsortedPackages = expandWithUnbuiltDependencies(requestedPackages, {
      buildFlavors: request.buildFlavors,
      clean: request.clean,
    });

    // 3. Validate podName in spm.config.json matches actual .podspec files
    await validateAllPodNamesAsync(unsortedPackages);

    // 4. Sort packages by dependencies (packages with no deps first)
    const { sorted, dependsOn } = sortPackagesByDependencies(unsortedPackages);
    ctx.packages = sorted;
    ctx.dependsOn = dependsOn;

    const externalPackages = ctx.packages.filter((p) => isExternalPackage(p));

    // 4b. Rebind each external package's source path to the install in any
    // workspace whose version satisfies bundledNativeModules.json. This decouples
    // the precompile from apps/bare-expo's pin, which drifts. Packages absent
    // from the bundled map keep their bare-expo-resolved path.
    rebindExternalPackagesToBundledVersions(
      externalPackages,
      await getBundledVersionsAsync(),
      resolveInstalledPackage
    );

    // Log external packages with their resolved versions, so the post-rebind
    // values are visible in the build output.
    if (externalPackages.length > 0) {
      logger.info(
        `📦 External packages to build:\n${chalk.blue(
          externalPackages.map((p) => `${p.packageName}@${p.packageVersion}`).join(', ')
        )}`
      );
    }

    // 5. Get versions for React Native and Hermes
    const { reactNativeVersion, hermesVersion } = await getVersionsInfoAsync({
      reactNativeVersion: request.reactNativeVersionOverride,
      hermesVersion: request.hermesVersionOverride,
    });
    ctx.reactNativeVersion = reactNativeVersion;
    ctx.hermesVersion = hermesVersion;

    // 5b. Set versioned output prefix on external packages
    for (const pkg of ctx.packages) {
      if (isExternalPackage(pkg)) {
        pkg.outputVersionPrefix = path.join(pkg.packageVersion, reactNativeVersion, hermesVersion);
      }
    }

    // 6. Verify local tarball paths exist if provided
    const hasPlaceholder = (p?: string) => p?.includes('{flavor}') || p?.includes('{Flavor}');
    await verifyLocalTarballPathsIfSetAsync({
      reactNativeTarballPath: hasPlaceholder(request.localTarballTemplates.reactNative)
        ? undefined
        : request.localTarballTemplates.reactNative,
      hermesTarballPath: hasPlaceholder(request.localTarballTemplates.hermes)
        ? undefined
        : request.localTarballTemplates.hermes,
      reactNativeDependenciesTarballPath: hasPlaceholder(
        request.localTarballTemplates.reactNativeDependencies
      )
        ? undefined
        : request.localTarballTemplates.reactNativeDependencies,
    });

    // Resolve artifacts path
    ctx.artifactsPath = Artifacts.getArtifactsPath(PACKAGES_DIR);
  },
};

export const prepareCacheStep: Step<PrebuildContext> = {
  id: 'prepare:cache',
  scope: 'run',
  label: 'Clean cache',
  onError: 'stop-run',

  shouldRun: (ctx) => ctx.request.cleanCache,

  async run(ctx) {
    await Dependencies.cleanArtifactsAsync(ctx.artifactsPath);
  },
};

// ---------------------------------------------------------------------------
// Helper: collectSharedSPMDependencies
// ---------------------------------------------------------------------------

export interface SharedSPMDependency {
  dep: SPMPackageDependencyConfig;
  /** Package names that use this dependency */
  usedBy: string[];
}

/**
 * Collects all unique SPM package dependencies across all packages/products.
 * Dependencies are deduplicated by productName — the first encountered version wins.
 * Also tracks which packages use each dependency.
 */
export function collectSharedSPMDependencies(packages: SPMPackageSource[]): SharedSPMDependency[] {
  const seen = new Map<string, SharedSPMDependency>();

  for (const pkg of packages) {
    let spmConfig;
    try {
      spmConfig = pkg.getSwiftPMConfiguration();
    } catch {
      continue;
    }

    for (const product of spmConfig.products) {
      if (!product.spmPackages) continue;
      for (const dep of product.spmPackages) {
        const existing = seen.get(dep.productName);
        if (existing) {
          if (!existing.usedBy.includes(pkg.packageName)) {
            existing.usedBy.push(pkg.packageName);
          }
        } else {
          seen.set(dep.productName, { dep, usedBy: [pkg.packageName] });
        }
      }
    }
  }

  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// prepare:shared-spm-deps
// ---------------------------------------------------------------------------

export const prepareSharedSPMDepsStep: Step<PrebuildContext> = {
  id: 'prepare:shared-spm-deps',
  scope: 'run',
  label: 'Build shared SPM dependencies',
  onError: 'stop-run',

  shouldRun: (ctx) => {
    // Skip if builds are being skipped entirely
    if (ctx.request.skipBuild && ctx.request.skipGenerate) return false;
    // Only run if any package has spmPackages
    const shared = collectSharedSPMDependencies(ctx.packages);
    return shared.length > 0;
  },

  async run(ctx) {
    const shared = collectSharedSPMDependencies(ctx.packages);

    logger.info(
      `📦 Found ${shared.length} shared SPM ${shared.length === 1 ? 'dependency' : 'dependencies'}:`
    );
    for (const { dep, usedBy } of shared) {
      logger.info(`   ${chalk.cyan(dep.productName)} ← ${usedBy.join(', ')}`);
    }

    // When --clean is passed, wipe shared SPM dep build dirs and xcframeworks
    // so they're rebuilt from scratch (including re-resolving dependencies).
    if (ctx.request.clean) {
      const spmDepsRoot = Frameworks.getSharedSPMDepsRoot();
      logger.info(`🧹 Cleaning shared SPM dependency caches...`);
      for (const { dep } of shared) {
        const depDir = path.join(spmDepsRoot, dep.productName);
        await fsExtra.remove(depDir);
      }
      // Also clean the shared SourcePackages cache
      await fsExtra.remove(path.join(spmDepsRoot, '_SourcePackages'));
    }

    // Build a lookup map of all shared deps for inter-dependency detection
    const allSharedDeps = new Map(shared.map(({ dep }) => [dep.productName, dep]));

    for (const flavor of ctx.request.buildFlavors) {
      for (const { dep } of shared) {
        await buildSharedSPMDependencyAsync(dep, flavor, allSharedDeps);
      }
    }
  },
};

/**
 * All run-scope steps in execution order.
 */
export const runSteps: Step<PrebuildContext>[] = [
  prepareInputsStep,
  prepareCacheStep,
  prepareSharedSPMDepsStep,
];
