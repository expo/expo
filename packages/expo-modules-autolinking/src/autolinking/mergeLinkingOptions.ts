import findUp from 'find-up';
import fs from 'fs';
import path from 'path';

import type { PlatformAutolinkingOptions, SearchOptions, SupportedPlatform } from '../types';

async function loadPackageJSONAsync(packageJsonPath: string) {
  const packageJsonText = await fs.promises.readFile(packageJsonPath, 'utf8');
  return JSON.parse(packageJsonText);
}

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
  const packageJsonPath = await getProjectPackageJsonPathAsync(providedOptions.projectRoot);
  const packageJson = await loadPackageJSONAsync(packageJsonPath);

  const baseOptions = packageJson.expo?.autolinking as PlatformAutolinkingOptions;
  const platformOptions = getPlatformOptions(providedOptions.platform, baseOptions);
  const finalOptions = Object.assign(
    {},
    baseOptions,
    platformOptions,
    providedOptions
  ) as OptionsType;

  // Makes provided paths absolute or falls back to default paths if none was provided.
  finalOptions.searchPaths = await resolveSearchPathsAsync(
    finalOptions.searchPaths || [],
    providedOptions.projectRoot
  );

  finalOptions.nativeModulesDir = await resolveNativeModulesDirAsync(
    finalOptions.nativeModulesDir,
    providedOptions.projectRoot
  );

  // We shouldn't assume that `projectRoot` (which typically is CWD) is already at the project root
  finalOptions.projectRoot = path.dirname(packageJsonPath);

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
  return searchPaths?.map((searchPath) => path.resolve(cwd, searchPath)) || [];
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
  options?: PlatformAutolinkingOptions
): PlatformAutolinkingOptions {
  if (platform === 'apple') {
    return options?.apple ?? options?.ios ?? {};
  }
  return options?.[platform] ?? {};
}
