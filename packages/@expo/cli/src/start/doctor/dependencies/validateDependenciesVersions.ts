import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import assert from 'assert';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { BundledNativeModules } from './bundledNativeModules';
import { getCombinedKnownVersionsAsync } from './getVersionedPackages';

const debug = require('debug')('expo:doctor:dependencies:validate') as typeof console.log;

interface IncorrectDependency {
  packageName: string;
  packageType: 'dependencies' | 'devDependencies';
  expectedVersionOrRange: string;
  actualVersion: string;
}

/**
 * Print a list of incorrect dependency versions.
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
): Promise<boolean> {
  const incorrectDeps = await getVersionedDependenciesAsync(projectRoot, exp, pkg, packagesToCheck);
  return logIncorrectDependencies(incorrectDeps);
}

function logInvalidDependency({
  packageName,
  expectedVersionOrRange,
  actualVersion,
}: IncorrectDependency) {
  Log.warn(
    // chalk` - {underline ${packageName}} - expected version: {underline ${expectedVersionOrRange}} - actual version installed: {underline ${actualVersion}}`
    chalk`  {bold ${packageName}}{cyan @}{red ${actualVersion}} - expected version: {green ${expectedVersionOrRange}}`
  );
}

export function logIncorrectDependencies(incorrectDeps: IncorrectDependency[]) {
  if (!incorrectDeps.length) {
    return true;
  }

  Log.warn(chalk`Some dependencies are incompatible with the installed {bold expo} version:`);
  incorrectDeps.forEach((dep) => logInvalidDependency(dep));

  const requiredVersions = incorrectDeps.map(
    ({ packageName, expectedVersionOrRange }) => `${packageName}@${expectedVersionOrRange}`
  );

  Log.warn(
    'Your project may not work correctly until you install the correct versions of the packages.\n' +
      chalk`Install individual packages by running {inverse npx expo install ${requiredVersions.join(
        ' '
      )}}`
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
    resolvedDependencies,
    combinedKnownPackages
  );
  debug(`Comparing known versions: %O`, resolvedPackagesToCheck);
  debug(`Skipping packages that cannot be versioned automatically: %O`, unknown);
  // read package versions from the file system (node_modules)
  const packageVersions = await resolvePackageVersionsAsync(projectRoot, resolvedPackagesToCheck);
  debug(`Package versions: %O`, packageVersions);
  // find incorrect dependencies by comparing the actual package versions with the bundled native module version ranges
  const incorrectDeps = findIncorrectDependencies(pkg, packageVersions, combinedKnownPackages);
  debug(`Incorrect dependencies: %O`, incorrectDeps);

  return incorrectDeps;
}

function getFilteredObject(keys: string[], object: Record<string, string>) {
  return keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = object[key];
    return acc;
  }, {});
}

function getPackagesToCheck(
  dependencies: Record<string, string> | null | undefined,
  bundledNativeModules: BundledNativeModules
): { known: string[]; unknown: string[] } {
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

async function resolvePackageVersionsAsync(
  projectRoot: string,
  packages: string[]
): Promise<Record<string, string>> {
  const packageVersionsFromPackageJSON = await Promise.all(
    packages.map((packageName) => getPackageVersionAsync(projectRoot, packageName))
  );
  return packages.reduce((acc, packageName, idx) => {
    acc[packageName] = packageVersionsFromPackageJSON[idx];
    return acc;
  }, {} as Record<string, string>);
}

async function getPackageVersionAsync(projectRoot: string, packageName: string): Promise<string> {
  let packageJsonPath: string | undefined;
  try {
    packageJsonPath = resolveFrom(projectRoot, `${packageName}/package.json`);
  } catch (error: any) {
    // This is a workaround for packages using `exports`. If this doesn't
    // include `package.json`, we have to use the error message to get the location.
    if (error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      packageJsonPath = error.message.match(/("exports"|defined) in (.*)$/i)?.[2];
    }
  }
  if (!packageJsonPath) {
    throw new CommandError(
      `"${packageName}" is added as a dependency in your project's package.json but it doesn't seem to be installed. Please run "yarn" or "npm install" to fix this issue.`
    );
  }
  const packageJson = await JsonFile.readAsync<BundledNativeModules>(packageJsonPath);
  return packageJson.version;
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
    if (
      typeof expectedVersionOrRange === 'string' &&
      !semver.intersects(expectedVersionOrRange, actualVersion)
    ) {
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

function findDependencyType(
  pkg: PackageJSONConfig,
  packageName: string
): IncorrectDependency['packageType'] {
  if (pkg.devDependencies && packageName in pkg.devDependencies) {
    return 'devDependencies';
  }

  return 'dependencies';
}
