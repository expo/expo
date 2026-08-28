// @ref llp/0004-smart-start-and-project-state.rfc.md
// Reading the project's dependency tree from disk. Everything here inspects files only: no
// package of the project is ever loaded, so probing a project cannot run project code.
import fs from 'fs';
import path from 'path';

import { fileExistsAsync } from '../utils/dir';

/** The fields of a project `package.json` the probe reads. */
export interface ProjectPackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/** File holding the modules bundled in the Expo Go app, shipped by the `expo` package. */
const BUNDLED_NATIVE_MODULES_FILE = 'bundledNativeModules.json';

/** Strip the version range from a package spec, e.g. `@expo/ui@~1.2.0` -> `@expo/ui`. */
export function parsePackageName(spec: string): string {
  const versionIndex = spec.indexOf('@', 1);
  return versionIndex > 0 ? spec.slice(0, versionIndex) : spec;
}

/**
 * The npm package a module path belongs to, e.g. `expo-build-properties/app.plugin.js` ->
 * `expo-build-properties`.
 *
 * @returns the package name, or `null` for a path into the project itself.
 */
export function parsePackageNameFromModulePath(modulePath: string): string | null {
  if (modulePath.startsWith('.') || path.isAbsolute(modulePath)) {
    return null;
  }
  const segments = modulePath.split('/');
  const name = modulePath.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
  return name || null;
}

/** Parse a JSON file, or return `null` when it is missing or malformed. */
export async function readJsonFileAsync<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.promises.readFile(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

/**
 * Find the directory of a package installed for a project.
 *
 * The lookup walks the `node_modules` directories from the project upwards, the way Node
 * resolves a package, but without `require.resolve`: a package that ships no importable entry
 * point (or whose `exports` hides `package.json`) must still be found, and no project code may
 * be executed.
 *
 * The walk stops at the filesystem root, which is the stop rule the whole package shares —
 * `resolveProjectBin` (`src/utils/projectBin.ts`) states why a workspace root is not a thing a
 * filesystem marks, and `detectPackageManager` stops there for the same reason.
 *
 * @returns the package directory, or `null` when the package is not installed.
 */
export async function resolvePackageRootAsync(
  projectRoot: string,
  packageName: string
): Promise<string | null> {
  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    const packageRoot = path.join(dir, 'node_modules', ...packageName.split('/'));
    if (await fileExistsAsync(path.join(packageRoot, 'package.json'))) {
      return packageRoot;
    }
    if (path.dirname(dir) === dir) {
      return null;
    }
  }
}

/**
 * {@link resolvePackageRootAsync}, for the callers that cannot await.
 *
 * The same walk and the same rules; the spelling differs because the fingerprint cache resolves a
 * version on the path that decides whether to spawn at all, beside a `resolveFingerprintCli` that
 * is synchronous for the same reason. One `statSync` per ancestor, which is what the async twin
 * costs too.
 */
export function resolvePackageRootSync(projectRoot: string, packageName: string): string | null {
  for (let dir = projectRoot; ; dir = path.dirname(dir)) {
    const packageRoot = path.join(dir, 'node_modules', ...packageName.split('/'));
    if (fs.statSync(path.join(packageRoot, 'package.json'), { throwIfNoEntry: false })?.isFile()) {
      return packageRoot;
    }
    if (path.dirname(dir) === dir) {
      return null;
    }
  }
}

/** Parse a JSON file synchronously, or return `null` when it is missing or malformed. */
export function readJsonFileSync<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function readProjectPackageJsonAsync(
  projectRoot: string
): Promise<ProjectPackageJson | null> {
  return await readJsonFileAsync<ProjectPackageJson>(path.join(projectRoot, 'package.json'));
}

/** Every package the project declares, as dependency or dev dependency. */
export function listDependencyNames(packageJson: ProjectPackageJson | null): string[] {
  return [
    ...new Set([
      ...Object.keys(packageJson?.dependencies ?? {}),
      ...Object.keys(packageJson?.devDependencies ?? {}),
    ]),
  ].sort();
}

/**
 * Whether a package is both declared by the project and present in `node_modules`. A declared
 * but uninstalled package says nothing about how the app runs today, which is what the probe
 * reports.
 */
export async function isInstalledDependencyAsync(
  projectRoot: string,
  dependencyNames: string[],
  packageName: string
): Promise<boolean> {
  if (!dependencyNames.includes(packageName)) {
    return false;
  }
  return (await resolvePackageRootAsync(projectRoot, packageName)) != null;
}

/** The version of the `expo` package installed in the project, i.e. its SDK version. */
export async function readSdkVersionAsync(projectRoot: string): Promise<string | null> {
  const expoRoot = await resolvePackageRootAsync(projectRoot, 'expo');
  if (!expoRoot) {
    return null;
  }
  const packageJson = await readJsonFileAsync<{ version?: string }>(
    path.join(expoRoot, 'package.json')
  );
  return packageJson?.version ?? null;
}

/**
 * The modules bundled in the Expo Go app of the project's SDK, mapped to their supported
 * version range. Read from the installed `expo` package, so the answer always matches the SDK
 * the project runs.
 *
 * @returns the map, or `null` when the `expo` package is not installed or ships no map.
 */
export async function loadBundledNativeModulesAsync(
  projectRoot: string
): Promise<Record<string, string> | null> {
  const expoRoot = await resolvePackageRootAsync(projectRoot, 'expo');
  if (!expoRoot) {
    return null;
  }
  return await readJsonFileAsync<Record<string, string>>(
    path.join(expoRoot, BUNDLED_NATIVE_MODULES_FILE)
  );
}
