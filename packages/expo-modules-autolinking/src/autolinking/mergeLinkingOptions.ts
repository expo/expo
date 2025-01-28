import findUp from 'find-up';
import fs from 'fs-extra';
import path from 'path';

import { AutolinkingOptions, SearchOptions, SupportedPlatform } from '../types';

/**
 * Find the path to the `package.json` of the closest project in the given project root.
 */
export async function getProjectPackageJsonPathAsync(projectRoot: string): Promise<string> {
  const result = await findUp('package.json', { cwd: projectRoot });
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${projectRoot}"`);
  }
  return result;
}

/**
 * Synchronous version of {@link getProjectPackageJsonPathAsync}.
 */
export function getProjectPackageJsonPathSync(projectRoot: string): string {
  const result = findUp.sync('package.json', { cwd: projectRoot });
  if (!result) {
    throw new Error(`Couldn't find "package.json" up from path "${projectRoot}"`);
  }
  return result;
}

/**
 * Merges autolinking options from different sources (the later the higher priority)
 * - options defined in package.json's `expo.autolinking` field
 * - platform-specific options from the above (e.g. `expo.autolinking.apple`)
 * - options provided to the CLI command
 */
export async function mergeLinkingOptionsAsync<OptionsType extends SearchOptions>(
  providedOptions: OptionsType
): Promise<OptionsType> {
  const packageJson = require(await getProjectPackageJsonPathAsync(providedOptions.projectRoot));
  const baseOptions = packageJson.expo?.autolinking as AutolinkingOptions;
  const platformOptions = getPlatformOptions(providedOptions.platform, baseOptions);
  const finalOptions = Object.assign(
    {},
    baseOptions,
    platformOptions,
    providedOptions
  ) as OptionsType;

  // Makes provided paths absolute or falls back to default paths if none was provided.
  finalOptions.searchPaths = await resolveSearchPathsAsync(
    finalOptions.searchPaths,
    providedOptions.projectRoot
  );

  finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(
    finalOptions.nativeModulesDir,
    providedOptions.projectRoot
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

/**
 * Gets the platform-specific autolinking options from the base options.
 */
function getPlatformOptions(
  platform: SupportedPlatform,
  options?: AutolinkingOptions
): AutolinkingOptions {
  if (platform === 'apple') {
    return options?.apple ?? options?.ios ?? {};
  }
  return options?.[platform] ?? {};
}
