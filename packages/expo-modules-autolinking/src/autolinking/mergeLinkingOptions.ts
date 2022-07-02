import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';

import { SearchOptions } from '../types';

/**
 * Path to the `package.json` of the closest project in the current working dir.
 */
export const projectPackageJsonPath = findUp.sync('package.json', { cwd: process.cwd() }) as string;

// This won't happen in usual scenarios, but we need to unwrap the optional path :)
if (!projectPackageJsonPath) {
  throw new Error(`Couldn't find "package.json" up from path "${process.cwd()}"`);
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
async function findDefaultPathsAsync(cwd: string): Promise<string[]> {
  const paths = [];
  let dir = cwd;
  let pkgJsonPath: string | undefined;

  while ((pkgJsonPath = await findUp('package.json', { cwd: dir }))) {
    dir = path.dirname(path.dirname(pkgJsonPath));
    paths.push(path.join(pkgJsonPath, '..', 'node_modules'));

    // This stops the infinite loop when the package.json is placed at the root dir.
    if (path.dirname(dir) === dir) {
      break;
    }
  }
  return paths;
}

/**
 * Finds the real path to custom native modules directory.
 * - When {@link cwd} is inside the project directory, the path is searched relatively
 * to the project root (directory with the `package.json` file).
 * - When {@link cwd} is outside project directory (no `package.json` found), it is relative to
 * the current working directory (the {@link cwd} param).
 *
 * @param nativeModulesDir path to custom native modules directory. Defaults to `"./modules"` if null.
 * @param cwd current working directory
 * @returns resolved native modules directory or `null` if it is not found or doesn't exist.
 */
async function resolveNativeModulesDirAsync(
  nativeModulesDir: string | null | undefined,
  cwd: string
): Promise<string | null> {
  const packageJsonPath = await findUp('package.json', { cwd });
  const projectRoot = packageJsonPath != null ? path.join(packageJsonPath, '..') : cwd;
  const resolvedPath = path.resolve(projectRoot, nativeModulesDir || 'modules');
  return fs.existsSync(resolvedPath) ? resolvedPath : null;
}
