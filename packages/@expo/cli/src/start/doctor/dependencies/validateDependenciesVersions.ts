import { ExpoConfig, PackageJSONConfig } from '@expo/config';
import JsonFile from '@expo/json-file';
import assert from 'assert';
import chalk from 'chalk';
import resolveFrom from 'resolve-from';
import semver from 'semver';

import * as Log from '../../../log';
import { CommandError } from '../../../utils/errors';
import { BundledNativeModules, getBundledNativeModulesAsync } from './bundledNativeModules';

export async function validateDependenciesVersionsAsync(
  projectRoot: string,
  exp: Pick<ExpoConfig, 'sdkVersion'>,
  pkg: PackageJSONConfig
): Promise<boolean> {
  let bundledNativeModules: BundledNativeModules | null = null;

  assert(exp.sdkVersion);
  bundledNativeModules = await getBundledNativeModulesAsync(
    projectRoot,
    // sdkVersion is defined here because we ran the >= 33.0.0 check before
    exp.sdkVersion
  );

  // intersection of packages from package.json and bundled native modules
  const packagesToCheck = getPackagesToCheck(pkg.dependencies, bundledNativeModules);
  // read package versions from the file system (node_modules)
  const packageVersions = await resolvePackageVersionsAsync(projectRoot, packagesToCheck);
  // find incorrect dependencies by comparing the actual package versions with the bundled native module version ranges
  const incorrectDeps = findIncorrectDependencies(packageVersions, bundledNativeModules);

  if (incorrectDeps.length > 0) {
    Log.warn('Some dependencies are incompatible with the installed expo package version:');
    incorrectDeps.forEach(({ packageName, expectedVersionOrRange, actualVersion }) => {
      Log.warn(
        ` - ${chalk.underline(packageName)} - expected version: ${chalk.underline(
          expectedVersionOrRange
        )} - actual version installed: ${chalk.underline(actualVersion)}`
      );
    });

    Log.warn(
      'Your project may not work correctly until you install the correct versions of the packages.\n' +
        chalk`Install individual packages by running {inverse expo install [package-name ...]}`
    );
    // Log.warn(
    //   'Your project may not work correctly until you install the correct versions of the packages.\n' +
    //     `To install the correct versions of these packages, please run: ${chalk.inverse(
    //       'expo doctor --fix-dependencies'
    //     )},\n` +
    //     `or install individual packages by running ${chalk.inverse(
    //       'expo install [package-name ...]'
    //     )}`
    // );

    return false;
  }
  return true;
}

function getPackagesToCheck(
  dependencies: Record<string, string> | null | undefined,
  bundledNativeModules: BundledNativeModules
): string[] {
  const dependencyNames = Object.keys(dependencies ?? {});
  const result: string[] = [];
  for (const dependencyName of dependencyNames) {
    if (dependencyName in bundledNativeModules) {
      result.push(dependencyName);
    }
  }
  return result;
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

interface IncorrectDependency {
  packageName: string;
  expectedVersionOrRange: string;
  actualVersion: string;
}

function findIncorrectDependencies(
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
        expectedVersionOrRange,
        actualVersion,
      });
    }
  }
  return incorrectDeps;
}
