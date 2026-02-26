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
import path from 'path';

import { PACKAGES_DIR } from '../../Constants';
import { getPrecompileDir } from '../../Directories';
import logger from '../../Logger';
import { getPackageByName } from '../../Packages';
import { Artifacts } from '../Artifacts';
import { Dependencies } from '../Dependencies';
import type { SPMPackageSource } from '../ExternalPackage';
import { isExternalPackage } from '../ExternalPackage';
import { Frameworks } from '../Frameworks';
import {
  getVersionsInfoAsync,
  setForceNonInteractive,
  validateAllPodNamesAsync,
  verifyAllPackagesAsync,
  verifyLocalTarballPathsIfSetAsync,
} from '../Utils';
import type { BuildFlavor } from '../Prebuilder.types';

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

/**
 * Sorts packages in topological order based on their externalDependencies.
 * Packages with no dependencies come first, followed by packages that depend on them.
 */
export function sortPackagesByDependencies(packages: SPMPackageSource[]): SPMPackageSource[] {
  // Build a map of package name -> Package
  const packageMap = new Map<string, SPMPackageSource>();
  for (const pkg of packages) {
    packageMap.set(pkg.packageName, pkg);
  }

  // Build a map of product name -> package name
  // This is needed because external packages reference each other by product name
  // (e.g., "RNWorklets") rather than package name (e.g., "react-native-worklets")
  const productToPackage = new Map<string, string>();
  for (const pkg of packages) {
    try {
      const spmConfig = pkg.getSwiftPMConfiguration();
      for (const product of spmConfig.products) {
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
            // Only track dependencies that are in our build set
            if (packageMap.has(packageName)) {
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

    return [...packageMap.values()];
  }

  // Log the build order if it differs from input
  const originalOrder = [...packageMap.keys()].join(', ');
  const sortedOrder = sorted.map((p) => p.packageName).join(', ');
  if (originalOrder !== sortedOrder) {
    logger.info(`📋 Build order (sorted by dependencies):\n${chalk.cyan(sortedOrder)}`);
  }

  return sorted;
}

// ---------------------------------------------------------------------------
// Helper: expandWithUnbuiltDependencies
// ---------------------------------------------------------------------------

/**
 * Expands the package list to include unbuilt dependencies.
 * When a package depends on another monorepo package (via externalDependencies)
 * and that dependency's xcframework doesn't exist yet, it's automatically added
 * to the build set so the build can succeed without manual intervention.
 */
export function expandWithUnbuiltDependencies(packages: SPMPackageSource[]): SPMPackageSource[] {
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
        if (!product.externalDependencies) continue;

        for (const dep of product.externalDependencies) {
          if (!dep.includes('/')) continue;

          // Parse package name and product name (handle scoped: @expo/ui/ExpoUI)
          const parts = dep.split('/');
          const isScoped = parts[0].startsWith('@');
          const depPackageName = isScoped ? `${parts[0]}/${parts[1]}` : parts[0];
          const depProductName = isScoped ? parts[2] : parts[1];

          // Skip cache deps and deps already in the build set
          if (CACHE_DEPS.has(depPackageName)) continue;
          if (packagesByName.has(depPackageName) || added.has(depPackageName)) continue;

          // Check if the xcframework already exists (for both debug and release)
          const depBuildPath = path.join(getPrecompileDir(), '.build', depPackageName);
          const debugExists = fs.existsSync(
            Frameworks.getFrameworkPath(depBuildPath, depProductName, 'Debug')
          );
          const releaseExists = fs.existsSync(
            Frameworks.getFrameworkPath(depBuildPath, depProductName, 'Release')
          );

          if (debugExists && releaseExists) continue;

          // Try to find the package and add it to the build set
          const depPkg = getPackageByName(depPackageName);
          if (depPkg && depPkg.hasSwiftPMConfiguration()) {
            logger.info(
              `📎 Auto-adding ${chalk.cyan(depPackageName)} (required by ${chalk.green(pkg.packageName)}, xcframework not found)`
            );
            added.set(depPackageName, depPkg);
            changed = true;
          }
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

    // Enable verbose output (full build logs instead of spinners)
    if (request.verbose) {
      setForceNonInteractive(true);
    }

    if (request.packageNames.length > 0) {
      logger.info(`📦 Prebuilding packages: ${chalk.green(request.packageNames.join(', '))}`);
    } else {
      const externalNote = request.includeExternal ? ' (including external packages)' : '';
      logger.info(`📦 Discovering packages with spm.config.json${externalNote}...`);
    }

    // 1. Verify packages exist and have spm.config.json (or discover all)
    const requestedPackages = await verifyAllPackagesAsync(
      request.packageNames,
      request.includeExternal
    );

    // 2. Auto-add unbuilt dependencies to the build set
    const unsortedPackages = expandWithUnbuiltDependencies(requestedPackages);

    // 3. Validate podName in spm.config.json matches actual .podspec files
    await validateAllPodNamesAsync(unsortedPackages);

    // 4. Sort packages by dependencies (packages with no deps first)
    ctx.packages = sortPackagesByDependencies(unsortedPackages);

    // Log external packages if any
    const externalPackages = ctx.packages.filter((p) => isExternalPackage(p));
    if (externalPackages.length > 0) {
      logger.info(
        `📦 External packages to build:\n${chalk.blue(externalPackages.map((p) => p.packageName).join(', '))}`
      );
    }

    // 5. Get versions for React Native and Hermes
    const { reactNativeVersion, hermesVersion } = await getVersionsInfoAsync({
      reactNativeVersion: request.reactNativeVersionOverride,
      hermesVersion: request.hermesVersionOverride,
    });
    ctx.reactNativeVersion = reactNativeVersion;
    ctx.hermesVersion = hermesVersion;

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

/**
 * All run-scope steps in execution order.
 */
export const runSteps: Step<PrebuildContext>[] = [prepareInputsStep, prepareCacheStep];
