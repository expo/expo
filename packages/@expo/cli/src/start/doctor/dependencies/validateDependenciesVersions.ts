import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import assert from 'assert';
import chalk from 'chalk';
import npmPackageArg from 'npm-package-arg';
import semver from 'semver';
import semverRangeSubset from 'semver/ranges/subset';

import { BundledNativeModules } from './bundledNativeModules';
import { getCombinedKnownVersionsAsync } from './getVersionedPackages';
import { resolveAllPackageVersionsAsync } from './resolvePackages';
import * as Log from '../../../log';
import { env } from '../../../utils/env';

const debug = require('debug')('expo:doctor:dependencies:validate') as typeof console.log;

type IncorrectDependency = {
  packageName: string;
  packageType: 'dependencies' | 'devDependencies';
  expectedVersionOrRange: string;
  actualVersion: string;
};

type DependenciesToCheck = { known: string[]; unknown: string[] };

/**
 * Print a list of incorrect dependency versions.
 * This only checks dependencies when not running in offline mode.
 *
 * @param projectRoot Expo project root.
 * @param exp Expo project config.
 * @param pkg Project's `package.json`.
 * @param packagesToCheck A list of packages to check, if undefined or empty, all will be checked.
 * @returns `true` if there are no incorrect dependencies.
 */
export async function validateDependenciesVersionsAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig,
  packagesToCheck?: string[]
): Promise<boolean | null> {
  if (env.EXPO_OFFLINE) {
    Log.warn('Skipping dependency validation in offline mode');
    return null;
  }

  const incorrectDeps = await getVersionedDependenciesAsync(projectRoot, exp, pkg, packagesToCheck);
  return logIncorrectDependencies(incorrectDeps);
}

function logInvalidDependency({
  packageName,
  expectedVersionOrRange,
  actualVersion,
}: IncorrectDependency) {
  Log.warn(
    chalk`  {bold ${packageName}}{cyan @}{red ${actualVersion}} - expected version: {green ${expectedVersionOrRange}}`
  );
}

export function logIncorrectDependencies(incorrectDeps: IncorrectDependency[]) {
  if (!incorrectDeps.length) {
    return true;
  }

  Log.warn(
    chalk`The following packages should be updated for best compatibility with the installed {bold expo} version:`
  );
  incorrectDeps.forEach((dep) => logInvalidDependency(dep));

  Log.warn(
    'Your project may not work correctly until you install the expected versions of the packages.'
  );

  return false;
}

/**
 * Return a list of versioned dependencies for the project SDK version.
 *
 * @param projectRoot Expo project root.
 * @param exp Expo project config.
 * @param pkg Project's `package.json`.
 * @param packagesToCheck A list of packages to check, if undefined or empty, all will be checked.
 * @returns A list of incorrect dependencies.
 */
export async function getVersionedDependenciesAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig,
  packagesToCheck?: string[]
): Promise<IncorrectDependency[]> {
  // This should never happen under normal circumstances since
  // the CLI is versioned in the `expo` package.
  assert(exp.sdkVersion, 'SDK Version is missing');

  // Get from both endpoints and combine the known package versions.
  const combinedKnownPackages = await getCombinedKnownVersionsAsync({
    projectRoot,
    sdkVersion: exp.sdkVersion,
  });
  // debug(`Known dependencies: %O`, combinedKnownPackages);

  const resolvedDependencies = packagesToCheck?.length
    ? // Diff the provided packages to ensure we only check against installed packages.
      getFilteredObject(packagesToCheck, { ...pkg.dependencies, ...pkg.devDependencies })
    : // If no packages are provided, check against the `package.json` `dependencies` + `devDependencies` object.
      { ...pkg.dependencies, ...pkg.devDependencies };
  debug(`Checking dependencies for ${exp.sdkVersion}: %O`, resolvedDependencies);

  // intersection of packages from package.json and bundled native modules
  const { known: resolvedPackagesToCheck, unknown } = getPackagesToCheck(
    combinedKnownPackages,
    resolvedDependencies
  );
  debug(`Comparing known versions: %O`, resolvedPackagesToCheck);
  debug(`Skipping packages that cannot be versioned automatically: %O`, unknown);
  // read package versions from the file system (node_modules)
  const packageVersions = await resolveAllPackageVersionsAsync(
    projectRoot,
    resolvedPackagesToCheck
  );
  debug(`Package versions: %O`, packageVersions);
  // find incorrect dependencies by comparing the actual package versions with the bundled native module version ranges
  let incorrectDeps = findIncorrectDependencies(pkg, packageVersions, combinedKnownPackages);
  debug(`Incorrect dependencies: %O`, incorrectDeps);

  if (pkg?.expo?.install?.exclude) {
    const packagesToExclude = pkg.expo.install.exclude;

    // Parse the exclude list to ensure we can factor in any specified version ranges
    const parsedPackagesToExclude = packagesToExclude.reduce(
      (acc: Record<string, npmPackageArg.Result>, packageName: string) => {
        const npaResult = npmPackageArg(packageName);
        if (typeof npaResult.name === 'string') {
          acc[npaResult.name] = npaResult;
        } else {
          acc[packageName] = npaResult;
        }
        return acc;
      },
      {}
    );

    const incorrectAndExcludedDeps = incorrectDeps
      .filter((dep) => {
        if (parsedPackagesToExclude[dep.packageName]) {
          const { name, raw, rawSpec, type } = parsedPackagesToExclude[dep.packageName];
          const suggestedRange = combinedKnownPackages[name];

          // If only the package name itself is specified, then we keep it in the exclude list
          if (name === raw) {
            return true;
          } else if (type === 'version') {
            return suggestedRange === rawSpec;
          } else if (type === 'range') {
            // Fall through exclusions if the suggested range is invalid
            if (!semver.validRange(suggestedRange)) {
              debug(
                `Invalid semver range in combined known packages for package ${name} in expo.install.exclude: %O`,
                suggestedRange
              );
              return false;
            }

            return semverRangeSubset(suggestedRange, rawSpec);
          } else {
            debug(
              `Unsupported npm package argument type for package ${name} in expo.install.exclude: %O`,
              type
            );
          }
        }

        return false;
      })
      .map((dep) => dep.packageName);

    debug(
      `Incorrect dependency warnings filtered out by expo.install.exclude: %O`,
      incorrectAndExcludedDeps
    );
    incorrectDeps = incorrectDeps.filter(
      (dep) => !incorrectAndExcludedDeps.includes(dep.packageName)
    );
  }

  return incorrectDeps;
}

function getFilteredObject(keys: string[], object: Record<string, string>) {
  return keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = object[key];
    return acc;
  }, {});
}

function getPackagesToCheck(
  bundledNativeModules: BundledNativeModules,
  dependencies?: Record<string, string> | null
): DependenciesToCheck {
  const dependencyNames = Object.keys(dependencies ?? {});
  const known: string[] = [];
  const unknown: string[] = [];
  for (const dependencyName of dependencyNames) {
    if (dependencyName in bundledNativeModules) {
      known.push(dependencyName);
    } else {
      unknown.push(dependencyName);
    }
  }
  return { known, unknown };
}

function findIncorrectDependencies(
  pkg: PackageJSONConfig,
  packageVersions: Record<string, string>,
  bundledNativeModules: BundledNativeModules
): IncorrectDependency[] {
  const packages = Object.keys(packageVersions);
  const incorrectDeps: IncorrectDependency[] = [];
  for (const packageName of packages) {
    const expectedVersionOrRange = bundledNativeModules[packageName];
    const actualVersion = packageVersions[packageName];
    if (isDependencyVersionIncorrect(packageName, actualVersion, expectedVersionOrRange)) {
      incorrectDeps.push({
        packageName,
        packageType: findDependencyType(pkg, packageName),
        expectedVersionOrRange,
        actualVersion,
      });
    }
  }
  return incorrectDeps;
}

export function isDependencyVersionIncorrect(
  packageName: string,
  actualVersion: string,
  expectedVersionOrRange?: string
) {
  if (!expectedVersionOrRange) {
    return false;
  }

  // we never want to go backwards with the expo patch version
  if (packageName === 'expo') {
    return semver.ltr(actualVersion, expectedVersionOrRange);
  }

  // For all other packages, check if the actual version satisfies the expected range
  const satisfies = semver.satisfies(actualVersion, expectedVersionOrRange, {
    includePrerelease: true,
  });

  return !satisfies;
}

function findDependencyType(
  pkg: PackageJSONConfig,
  packageName: string
): IncorrectDependency['packageType'] {
  if (pkg.devDependencies && packageName in pkg.devDependencies) {
    return 'devDependencies';
  }

  return 'dependencies';
}
