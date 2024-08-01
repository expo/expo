import { getPackageJson, PackageJSONConfig } from '@expo/config';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { intersects as semverIntersects, Range as SemverRange } from 'semver';

import * as Log from '../log';
import { isModuleSymlinked } from '../utils/isModuleSymlinked';
import { logNewSection } from '../utils/ora';

export type DependenciesMap = { [key: string]: string | number };

export type DependenciesModificationResults = {
  /** A list of new values were added to the `dependencies` object in the `package.json`. */
  changedDependencies: string[];
};

/** Modifies the `package.json` with `modifyPackageJson` and format/displays the results. */
export async function updatePackageJSONAsync(
  projectRoot: string,
  {
    templateDirectory,
    templatePkg = getPackageJson(templateDirectory),
    pkg,
    skipDependencyUpdate,
  }: {
    templateDirectory: string;
    templatePkg?: PackageJSONConfig;
    pkg: PackageJSONConfig;
    skipDependencyUpdate?: string[];
  }
): Promise<DependenciesModificationResults> {
  const updatingPackageJsonStep = logNewSection('Updating package.json');

  const results = modifyPackageJson(projectRoot, {
    templatePkg,
    pkg,
    skipDependencyUpdate,
  });

  const hasChanges = results.changedDependencies.length || results.scriptsChanged;

  // NOTE: This is effectively bundler caching and subject to breakage if the inputs don't match the mutations.
  if (hasChanges) {
    await fs.promises.writeFile(
      path.resolve(projectRoot, 'package.json'),
      // Add new line to match the format of running yarn.
      // This prevents the `package.json` from changing when running `prebuild --no-install` multiple times.
      JSON.stringify(pkg, null, 2) + '\n'
    );
  }

  updatingPackageJsonStep.succeed(
    'Updated package.json' + (hasChanges ? '' : chalk.dim(` | no changes`))
  );

  return results;
}

/**
 * Make required modifications to the `package.json` file as a JSON object.
 *
 * 1. Update `package.json` `scripts`.
 * 2. Update `package.json` `dependencies` (not `devDependencies`).
 * 3. Update `package.json` `main`.
 *
 * @param projectRoot The root directory of the project.
 * @param props.templatePkg Template project package.json as JSON.
 * @param props.pkg Current package.json as JSON.
 * @param props.skipDependencyUpdate Array of dependencies to skip updating.
 * @returns
 */
function modifyPackageJson(
  projectRoot: string,
  {
    templatePkg,
    pkg,
    skipDependencyUpdate,
  }: {
    templatePkg: PackageJSONConfig;
    pkg: PackageJSONConfig;
    /** @deprecated Required packages are not overwritten, only added when missing */
    skipDependencyUpdate?: string[];
  }
) {
  const scriptsChanged = updatePkgScripts({ pkg });

  // TODO: Move to `npx expo-doctor`
  return {
    scriptsChanged,
    ...updatePkgDependencies(projectRoot, {
      pkg,
      templatePkg,
      skipDependencyUpdate,
    }),
  };
}

/**
 * Update `package.json` dependencies by combining the `dependencies` in the
 * project we are creating with the dependencies in the template project.
 *
 * > Exposed for testing.
 */
export function updatePkgDependencies(
  projectRoot: string,
  {
    pkg,
    templatePkg,
    skipDependencyUpdate = [],
  }: {
    pkg: PackageJSONConfig;
    templatePkg: PackageJSONConfig;
    /** @deprecated Required packages are not overwritten, only added when missing */
    skipDependencyUpdate?: string[];
  }
): DependenciesModificationResults {
  const { dependencies } = templatePkg;
  // The default values come from the bare-minimum template's package.json.
  // Users can change this by using different templates with the `--template` flag.
  // The main reason for allowing the changing of dependencies would be to include
  // dependencies that are required for the native project to build. For example,
  // it does not need to include dependencies that are used in the JS-code only.
  const defaultDependencies = createDependenciesMap(dependencies);

  // NOTE: This is a hack to ensure this doesn't trigger an extraneous change in the `package.json`
  // it isn't required for anything in the `ios` and `android` folders.
  delete defaultDependencies['expo-status-bar'];
  // NOTE: Expo splash screen is installed by default in the template but the config plugin also lives in prebuild-config
  // so we can delete it to prevent an extraneous change in the `package.json`.
  delete defaultDependencies['expo-splash-screen'];

  const combinedDependencies: DependenciesMap = createDependenciesMap({
    ...defaultDependencies,
    ...pkg.dependencies,
  });

  // These dependencies are only added, not overwritten from the project
  const requiredDependencies = [
    // TODO: This is no longer required because it's this same package.
    'expo',
    // TODO: Drop this somehow.
    'react-native',
  ].filter((depKey) => !!defaultDependencies[depKey]);

  const symlinkedPackages: string[] = [];
  const nonRecommendedPackages: string[] = [];

  for (const dependenciesKey of requiredDependencies) {
    // If the local package.json defined the dependency that we want to overwrite...
    if (pkg.dependencies?.[dependenciesKey]) {
      // Then ensure it isn't symlinked (i.e. the user has a custom version in their yarn workspace).
      if (isModuleSymlinked(projectRoot, { moduleId: dependenciesKey, isSilent: true })) {
        // If the package is in the project's package.json and it's symlinked, then skip overwriting it.
        symlinkedPackages.push(dependenciesKey);
        continue;
      }

      // Do not modify manually skipped dependencies
      if (skipDependencyUpdate.includes(dependenciesKey)) {
        continue;
      }

      // Warn users for outdated dependencies when prebuilding
      const hasRecommendedVersion = versionRangesIntersect(
        pkg.dependencies[dependenciesKey],
        String(defaultDependencies[dependenciesKey])
      );
      if (!hasRecommendedVersion) {
        nonRecommendedPackages.push(`${dependenciesKey}@${defaultDependencies[dependenciesKey]}`);
      }
    }
  }

  if (symlinkedPackages.length) {
    Log.log(
      `\u203A Using symlinked ${symlinkedPackages
        .map((pkg) => chalk.bold(pkg))
        .join(', ')} instead of recommended version(s).`
    );
  }

  if (nonRecommendedPackages.length) {
    Log.warn(
      `\u203A Using current versions instead of recommended ${nonRecommendedPackages
        .map((pkg) => chalk.bold(pkg))
        .join(', ')}.`
    );
  }

  // Only change the dependencies if the normalized hash changes, this helps to reduce meaningless changes.
  const hasNewDependencies =
    hashForDependencyMap(pkg.dependencies) !== hashForDependencyMap(combinedDependencies);
  // Save the dependencies
  let changedDependencies: string[] = [];
  if (hasNewDependencies) {
    changedDependencies = diffKeys(combinedDependencies, pkg.dependencies ?? {}).sort();
    // Use Object.assign to preserve the original order of dependencies, this makes it easier to see what changed in the git diff.
    pkg.dependencies = Object.assign(pkg.dependencies ?? {}, combinedDependencies);
  }

  return {
    changedDependencies,
  };
}

function diffKeys(a: Record<string, any>, b: Record<string, any>): string[] {
  return Object.keys(a).filter((key) => a[key] !== b[key]);
}

/**
 * Create an object of type DependenciesMap a dependencies object or throw if not valid.
 *
 * @param dependencies - ideally an object of type {[key]: string} - if not then this will error.
 */
export function createDependenciesMap(dependencies: any): DependenciesMap {
  if (typeof dependencies !== 'object') {
    throw new Error(`Dependency map is invalid, expected object but got ${typeof dependencies}`);
  } else if (!dependencies) {
    return {};
  }

  const outputMap: DependenciesMap = {};

  for (const key of Object.keys(dependencies)) {
    const value = dependencies[key];
    if (typeof value === 'string') {
      outputMap[key] = value;
    } else {
      throw new Error(
        `Dependency for key \`${key}\` should be a \`string\`, instead got: \`{ ${key}: ${JSON.stringify(
          value
        )} }\``
      );
    }
  }
  return outputMap;
}

/**
 * Update package.json scripts - `npm start` should default to `expo
 * start --dev-client` rather than `expo start` after prebuilding, for example.
 */
function updatePkgScripts({ pkg }: { pkg: PackageJSONConfig }) {
  let hasChanged = false;
  if (!pkg.scripts) {
    pkg.scripts = {};
  }
  if (!pkg.scripts.android?.includes('run')) {
    pkg.scripts.android = 'expo run:android';
    hasChanged = true;
  }
  if (!pkg.scripts.ios?.includes('run')) {
    pkg.scripts.ios = 'expo run:ios';
    hasChanged = true;
  }
  return hasChanged;
}

function normalizeDependencyMap(deps: DependenciesMap): string[] {
  return Object.keys(deps)
    .map((dependency) => `${dependency}@${deps[dependency]}`)
    .sort();
}

export function hashForDependencyMap(deps: DependenciesMap = {}): string {
  const depsList = normalizeDependencyMap(deps);
  const depsString = depsList.join('\n');
  return createFileHash(depsString);
}

export function createFileHash(contents: string): string {
  // this doesn't need to be secure, the shorter the better.
  return crypto.createHash('sha1').update(contents).digest('hex');
}

/**
 * Determine if two semver ranges are overlapping or intersecting.
 * This is a safe version of `semver.intersects` that does not throw.
 */
function versionRangesIntersect(rangeA: string | SemverRange, rangeB: string | SemverRange) {
  try {
    return semverIntersects(rangeA, rangeB);
  } catch {
    return false;
  }
}
