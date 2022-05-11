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
 * @returns resolved native modules directory or `null` if it is not found or doesn't exist.
 */
async function resolveNativeModulesDirAsync(
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
