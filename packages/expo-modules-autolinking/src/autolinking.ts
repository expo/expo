import chalk from 'chalk';
import glob from 'fast-glob';
import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';

import {
  GenerateOptions,
  ModuleDescriptor,
  PackageRevision,
  ResolveOptions,
  SearchOptions,
  SearchResults,
} from './types';

// TODO: Rename to `expo-module.json`
const EXPO_MODULE_CONFIG_FILENAME = 'unimodule.json';

/**
 * Resolves autolinking search paths. If none is provided, it accumulates all node_modules when
 * going up through the path components. This makes workspaces work out-of-the-box without any configs.
 */
export async function resolveSearchPathsAsync(
  searchPaths: string[] | null,
  cwd: string
): Promise<string[]> {
  return searchPaths && searchPaths.length > 0
    ? searchPaths.map(searchPath => path.resolve(cwd, searchPath))
    : await findDefaultPathsAsync(cwd);
}

/**
 * Finds project's package.json and returns its path.
 */
export async function findPackageJsonPathAsync(): Promise<string | null> {
  return (await findUp('package.json', { cwd: process.cwd() })) ?? null;
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
 * Searches for modules to link based on given config.
 */
export async function findModulesAsync(providedOptions: SearchOptions): Promise<SearchResults> {
  const options = await mergeLinkingOptionsAsync(providedOptions);
  const results: SearchResults = {};

  for (const searchPath of options.searchPaths) {
    const paths = await glob(
      [`*/${EXPO_MODULE_CONFIG_FILENAME}`, `@*/*/${EXPO_MODULE_CONFIG_FILENAME}`],
      {
        cwd: searchPath,
      }
    );

    for (const packageConfigPath of paths) {
      const packagePath = await fs.realpath(path.join(searchPath, path.dirname(packageConfigPath)));
      const packageConfig = require(path.join(packagePath, EXPO_MODULE_CONFIG_FILENAME));
      const { name, version } = require(path.join(packagePath, 'package.json'));

      if (options.exclude?.includes(name) || !packageConfig.platforms?.includes(options.platform)) {
        continue;
      }

      const currentRevision: PackageRevision = {
        path: packagePath,
        version,
      };

      if (!results[name]) {
        // The revision that was found first will be the main one.
        // An array of duplicates is needed only here.
        results[name] = { ...currentRevision, duplicates: [] };
      } else if (
        results[name].path !== packagePath &&
        results[name].duplicates?.every(({ path }) => path !== packagePath)
      ) {
        results[name].duplicates?.push(currentRevision);
      }
    }
  }
  return results;
}

/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expoModules` field
 * - platform-specific options from the above (e.g. `expoModules.ios`)
 * - options provided to the CLI command
 */
export async function mergeLinkingOptionsAsync<OptionsType extends SearchOptions>(
  providedOptions: OptionsType
): Promise<OptionsType> {
  const packageJsonPath = await findPackageJsonPathAsync();
  const packageJson = packageJsonPath ? require(packageJsonPath) : {};
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

  return finalOptions;
}

/**
 * Verifies the search results by checking whether there are no duplicates.
 */
export function verifySearchResults(searchResults: SearchResults): number {
  const cwd = process.cwd();
  const relativePath: (pkg: PackageRevision) => string = pkg => path.relative(cwd, pkg.path);
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
  }
}
