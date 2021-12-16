import chalk from 'chalk';
import glob from 'fast-glob';
import findUp from 'find-up';
import fs from 'fs-extra';
import { createRequire } from 'module';
import path from 'path';

import { requireAndResolveExpoModuleConfig } from './ExpoModuleConfig';
import {
  GenerateOptions,
  ModuleDescriptor,
  PackageRevision,
  ResolveOptions,
  SearchOptions,
  SearchResults,
} from './types';

// Names of the config files. From lowest to highest priority.
const EXPO_MODULE_CONFIG_FILENAMES = ['unimodule.json', 'expo-module.config.json'];

/**
 * Path to the `package.json` of the closest project in the current working dir.
 */
const projectPackageJsonPath = findUp.sync('package.json', { cwd: process.cwd() }) as string;

// This won't happen in usual scenarios, but we need to unwrap the optional path :)
if (!projectPackageJsonPath) {
  throw new Error(`Couldn't find "package.json" up from path "${process.cwd()}"`);
}

/**
 * Custom `require` that resolves from the current working dir instead of this script path.
 * **Requires Node v12.2.0**
 */
const projectRequire = createRequire(projectPackageJsonPath);

/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
export async function resolveSearchPathsAsync(
  searchPaths: string[] | null,
  cwd: string
): Promise<string[]> {
  return searchPaths && searchPaths.length > 0
    ? searchPaths.map((searchPath) => path.resolve(cwd, searchPath))
    : await findDefaultPathsAsync(cwd);
}

/**
 * Looks up for workspace's `node_modules` paths.
 */
export async function findDefaultPathsAsync(cwd: string): Promise<string[]> {
  const paths = [];
  let dir = cwd;
  let pkgJsonPath: string | undefined;

  while ((pkgJsonPath = await findUp('package.json', { cwd: dir }))) {
    dir = path.dirname(path.dirname(pkgJsonPath));
    paths.push(path.join(pkgJsonPath, '..', 'node_modules'));
  }
  return paths;
}

/**
 * Finds the real path to custom native modules directory.
 * @returns undefined if custom modules dir not found or doesn't exist
 */
export async function resolveNativeModulesDirAsync(
  nativeModulesDir: string | null | undefined,
  cwd: string
): Promise<string | null> {
  // first try resolving the provided dir
  if (nativeModulesDir) {
    const nativeModulesDirPath = path.resolve(cwd, nativeModulesDir);
    if (await fs.pathExists(nativeModulesDirPath)) {
      return nativeModulesDirPath;
    }
  }

  // if not found, try to find it relative to the package.json
  const up = await findUp('package.json', { cwd });
  if (!up) {
    return null;
  }
  const resolvedPath = path.join(up, '..', nativeModulesDir || 'modules');
  return fs.existsSync(resolvedPath) ? resolvedPath : null;
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
 * ```
 */
async function findPackagesConfigPathsAsync(searchPath: string): Promise<string[]> {
  const bracedFilenames = '{' + EXPO_MODULE_CONFIG_FILENAMES.join(',') + '}';
  const paths = await glob([`*/${bracedFilenames}`, `@*/*/${bracedFilenames}`], {
    cwd: searchPath,
  });

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
 * if {@link options.fallbackToDirName} is true, it returns the dir name when `package.json` doesn't exist.
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
 * Searches for modules to link based on given config.
 */
export async function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  const options = await mergeLinkingOptionsAsync(providedOptions);
  const results: Map<string, PackageRevision> = new Map();

  const nativeModuleNames = new Set<string>();

  // custom native modules should be resolved first so that they can override other modules
  const searchPaths =
    options.nativeModulesDir && fs.existsSync(options.nativeModulesDir)
      ? [options.nativeModulesDir, ...options.searchPaths]
      : options.searchPaths;

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
  if (options.searchPaths.length <= 1) {
    return searchResults;
  }

  return filterToProjectDependencies(searchResults, {
    ...providedOptions,
    // Custom native modules are not filtered out
    // when they're not specified in package.json dependencies.
    alwaysIncludedPackagesNames: nativeModuleNames,
  });
}

/**
 * Filters out packages that are not the dependencies of the project.
 */
function filterToProjectDependencies(
  results: SearchResults,
  options: Pick<SearchOptions, 'silent'> & { alwaysIncludedPackagesNames?: Set<string> } = {}
) {
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
  visitPackage(projectPackageJsonPath);

  return filteredResults;
}

/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.ios`)
 * - options provided to the CLI command
 */
export async function mergeLinkingOptionsAsync<OptionsType extends SearchOptions>(
  providedOptions: OptionsType
): Promise<OptionsType> {
  const packageJson = require(projectPackageJsonPath);
  const baseOptions = packageJson.expo?.autolinking;
  const platformOptions = providedOptions.platform && baseOptions?.[providedOptions.platform];
  const finalOptions = Object.assign(
    {},
    baseOptions,
    platformOptions,
    providedOptions
  ) as OptionsType;

  // Makes provided paths absolute or falls back to default paths if none was provided.
  finalOptions.searchPaths = await resolveSearchPathsAsync(finalOptions.searchPaths, process.cwd());

  finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(
    finalOptions.nativeModulesDir,
    process.cwd()
  );

  return finalOptions;
}

/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export function verifySearchResults(searchResults: SearchResults): number {
  const cwd = process.cwd();
  const relativePath: (pkg: PackageRevision) => string = (pkg) => path.relative(cwd, pkg.path);
  let counter = 0;

  for (const moduleName in searchResults) {
    const revision = searchResults[moduleName];

    if (revision.duplicates?.length) {
      console.warn(`⚠️  Found multiple revisions of ${chalk.green(moduleName)}`);
      console.log(` - ${chalk.magenta(relativePath(revision))} (${chalk.cyan(revision.version)})`);

      for (const duplicate of revision.duplicates) {
        console.log(` - ${chalk.gray(relativePath(duplicate))} (${chalk.gray(duplicate.version)})`);
      }
      counter++;
    }
  }
  if (counter > 0) {
    console.warn(
      '⚠️  Please get rid of multiple revisions as it may introduce some side effects or compatibility issues'
    );
  }
  return counter;
}

/**
 * Resolves search results to a list of platform-specific configuration.
 */
export async function resolveModulesAsync(
  searchResults: SearchResults,
  options: ResolveOptions
): Promise<ModuleDescriptor[]> {
  const platformLinking = require(`./platforms/${options.platform}`);

  return (
    await Promise.all(
      Object.entries(searchResults).map(async ([packageName, revision]) => {
        const resolvedModule = await platformLinking.resolveModuleAsync(
          packageName,
          revision,
          options
        );
        return resolvedModule
          ? {
              packageName,
              packageVersion: revision.version,
              ...resolvedModule,
            }
          : null;
      })
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.packageName.localeCompare(b.packageName));
}

/**
 * Generates a source file listing all packages to link.
 * Right know it works only for Android platform.
 */
export async function generatePackageListAsync(
  modules: ModuleDescriptor[],
  options: GenerateOptions
) {
  try {
    const platformLinking = require(`./platforms/${options.platform}`);
    await platformLinking.generatePackageListAsync(modules, options.target, options.namespace);
  } catch (e) {
    console.error(
      chalk.red(`Generating package list is not available for platform: ${options.platform}`)
    );
    throw e;
  }
}

/**
 * Returns the priority of the config at given path. Higher number means higher priority.
 */
function configPriority(fullpath: string): number {
  return EXPO_MODULE_CONFIG_FILENAMES.indexOf(path.basename(fullpath));
}
