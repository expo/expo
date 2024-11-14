import chalk from 'chalk';
import glob from 'fast-glob';
import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';

import { getProjectPackageJsonPathAsync, mergeLinkingOptionsAsync } from './mergeLinkingOptions';
import { getIsolatedModulesPath } from './utils';
import { requireAndResolveExpoModuleConfig } from '../ExpoModuleConfig';
import { PackageRevision, SearchOptions, SearchResults } from '../types';

// Names of the config files. From lowest to highest priority.
const EXPO_MODULE_CONFIG_FILENAMES = ['unimodule.json', 'expo-module.config.json'];

/**
 * Searches for modules to link based on given config.
 */
export async function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  const options = await mergeLinkingOptionsAsync(providedOptions);
  const results: Map<string, PackageRevision> = new Map();

  const nativeModuleNames = new Set<string>();

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths = new Set(
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...options.searchPaths]
      : options.searchPaths
  );

  // `searchPaths` can be mutated to discover all "isolated modules groups", when using isolated modules
  for (const searchPath of searchPaths) {
    const isNativeModulesDir = searchPath === options.nativeModulesDir;

    const packageConfigPaths = await findPackagesConfigPathsAsync(searchPath);

    for (const packageConfigPath of packageConfigPaths) {
      const packagePath = await fs.realpath(path.join(searchPath, path.dirname(packageConfigPath)));
      const expoModuleConfig = requireAndResolveExpoModuleConfig(
        path.join(packagePath, path.basename(packageConfigPath))
      );

      const { name, version } = resolvePackageNameAndVersion(packagePath, {
        fallbackToDirName: isNativeModulesDir,
      });

      const maybeIsolatedModulesPath = getIsolatedModulesPath(packagePath, name);
      if (maybeIsolatedModulesPath) {
        searchPaths.add(maybeIsolatedModulesPath);
      }

      // we ignore the `exclude` option for custom native modules
      if (
        (!isNativeModulesDir && options.exclude?.includes(name)) ||
        !expoModuleConfig.supportsPlatform(options.platform)
      ) {
        continue;
      }

      // add the current revision to the results
      const currentRevision: PackageRevision = {
        path: packagePath,
        version,
        config: expoModuleConfig,
      };
      addRevisionToResults(results, name, currentRevision);

      // if the module is a native module, we need to add it to the nativeModuleNames set
      if (isNativeModulesDir && !nativeModuleNames.has(name)) {
        nativeModuleNames.add(name);
      }
    }
  }

  const searchResults: SearchResults = Object.fromEntries(results.entries());

  // It doesn't make much sense to strip modules if there is only one search path.
  // (excluding custom native modules path)
  // Workspace root usually doesn't specify all its dependencies (see Expo Go),
  // so in this case we should link everything.
  if (options.searchPaths.length <= 1 || options.onlyProjectDeps === false) {
    return searchResults;
  }

  return await filterToProjectDependenciesAsync(searchResults, {
    ...providedOptions,
    // Custom native modules are not filtered out
    // when they're not specified in package.json dependencies.
    alwaysIncludedPackagesNames: nativeModuleNames,
  });
}

/**
 * Returns the priority of the config at given path. Higher number means higher priority.
 */
function configPriority(fullpath: string): number {
  return EXPO_MODULE_CONFIG_FILENAMES.indexOf(path.basename(fullpath));
}

/**
 * Adds {@link revision} to the {@link results} map
 * or to package duplicates if it already exists.
 * @param results [mutable] yet resolved packages map
 * @param name resolved package name
 * @param revision resolved package revision
 */
function addRevisionToResults(
  results: Map<string, PackageRevision>,
  name: string,
  revision: PackageRevision
): void {
  if (!results.has(name)) {
    // The revision that was found first will be the main one.
    // An array of duplicates and the config are needed only here.
    results.set(name, {
      ...revision,
      duplicates: [],
    });
  } else if (
    results.get(name)?.path !== revision.path &&
    results.get(name)?.duplicates?.every(({ path }) => path !== revision.path)
  ) {
    const { config, duplicates, ...duplicateEntry } = revision;
    results.get(name)?.duplicates?.push(duplicateEntry);
  }
}

/**
 * Returns paths to the highest priority config files, relative to the {@link searchPath}.
 * @example
 * ```
 * // Given the following file exists: /foo/myapp/modules/mymodule/expo-module.config.json
 * await findPackagesConfigPathsAsync('/foo/myapp/modules');
 * // returns ['mymodule/expo-module.config.json']
 *
 * await findPackagesConfigPathsAsync('/foo/myapp/modules/mymodule');
 * // returns ['expo-module.config.json']
 * ```
 */
async function findPackagesConfigPathsAsync(searchPath: string): Promise<string[]> {
  const bracedFilenames = '{' + EXPO_MODULE_CONFIG_FILENAMES.join(',') + '}';
  const paths = await glob(
    [`*/${bracedFilenames}`, `@*/*/${bracedFilenames}`, `./${bracedFilenames}`],
    {
      cwd: searchPath,
    }
  );

  // If the package has multiple configs (e.g. `unimodule.json` and `expo-module.config.json` during the transition time)
  // then we want to give `expo-module.config.json` the priority.
  return Object.values(
    paths.reduce<Record<string, string>>((acc, configPath) => {
      const dirname = path.dirname(configPath);

      if (!acc[dirname] || configPriority(configPath) > configPriority(acc[dirname])) {
        acc[dirname] = configPath;
      }
      return acc;
    }, {})
  );
}

/**
 * Resolves package name and version for the given {@link packagePath} from its `package.json`.
 * if {@link fallbackToDirName} is true, it returns the dir name when `package.json` doesn't exist.
 * @returns object with `name` and `version` properties. `version` falls back to `UNVERSIONED` if cannot be resolved.
 */
function resolvePackageNameAndVersion(
  packagePath: string,
  { fallbackToDirName }: { fallbackToDirName?: boolean } = {}
): { name: string; version: string } {
  try {
    const { name, version } = require(path.join(packagePath, 'package.json'));
    return { name, version: version || 'UNVERSIONED' };
  } catch (e) {
    if (fallbackToDirName) {
      // we don't have the package.json name, so we'll use the directory name
      return {
        name: path.basename(packagePath),
        version: 'UNVERSIONED',
      };
    } else {
      throw e;
    }
  }
}

/**
 * Filters out packages that are not the dependencies of the project.
 */
async function filterToProjectDependenciesAsync(
  results: SearchResults,
  options: Pick<SearchOptions, 'projectRoot' | 'silent'> & {
    alwaysIncludedPackagesNames?: Set<string>;
  }
): Promise<SearchResults> {
  const filteredResults: SearchResults = {};
  const visitedPackages = new Set<string>();

  // iterate through always included package names and add them to the visited packages
  // if the results contains them
  for (const name of options.alwaysIncludedPackagesNames ?? []) {
    if (results[name] && !visitedPackages.has(name)) {
      filteredResults[name] = results[name];
      visitedPackages.add(name);
    }
  }

  // Helper for traversing the dependency hierarchy.
  function visitPackage(packageJsonPath: string) {
    const packageJson = require(packageJsonPath);

    // Prevent getting into the recursive loop.
    if (visitedPackages.has(packageJson.name)) {
      return;
    }
    visitedPackages.add(packageJson.name);

    // Iterate over the dependencies to find transitive modules.
    for (const dependencyName in packageJson.dependencies) {
      const dependencyResult = results[dependencyName];

      if (!filteredResults[dependencyName]) {
        let dependencyPackageJsonPath: string;

        if (dependencyResult) {
          filteredResults[dependencyName] = dependencyResult;
          dependencyPackageJsonPath = path.join(dependencyResult.path, 'package.json');
        } else {
          try {
            /**
             * Custom `require` that resolves from the current working dir instead of this script path.
             * **Requires Node v12.2.0**
             */
            const projectRequire = createRequire(packageJsonPath);
            dependencyPackageJsonPath = projectRequire.resolve(`${dependencyName}/package.json`);
          } catch (error: any) {
            // Some packages don't include package.json in its `exports` field,
            // but none of our packages do that, so it seems fine to just ignore that type of error.
            // Related issue: https://github.com/react-native-community/cli/issues/1168
            if (!options.silent && error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
              console.warn(
                chalk.yellow(`⚠️  Cannot resolve the path to "${dependencyName}" package.`)
              );
            }
            continue;
          }
        }

        // Visit the dependency package.
        visitPackage(dependencyPackageJsonPath);
      }
    }
  }

  // Visit project's package.
  const projectPackageJsonPath = await getProjectPackageJsonPathAsync(options.projectRoot);
  visitPackage(projectPackageJsonPath);

  return filteredResults;
}
