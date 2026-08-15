import type { ProjectConfig } from '@expo/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getExpoConfigLoaderPath, type LoadedModuleSource } from './ExpoConfigLoader';
import type { NormalizedOptions } from './Fingerprint.types';
import { spawnWithIpcAsync } from './utils/SpawnIPC';

/**
 * An out-of-process `expo/config` loader that can be used to get the Expo config and loaded modules.
 */
export async function getExpoConfigAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<{
  config: ProjectConfig | null;
  loadedModules: LoadedModuleSource[] | null;
}> {
  const result: {
    config: ProjectConfig | null;
    loadedModules: LoadedModuleSource[] | null;
  } = {
    config: null,
    loadedModules: null,
  };

  if (!resolveFrom.silent(path.resolve(projectRoot), 'expo/config')) {
    return result;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-fingerprint-'));
  const ignoredFile = await createTempIgnoredFileAsync(tmpDir, options);
  try {
    const [
      { config, loadedModules: modulesWithPlugins },
      { loadedModules: modulesWithoutPlugins },
    ] = await Promise.all([
      spawnConfigLoaderAsync(projectRoot, ignoredFile, /* skipPlugins */ false),
      spawnConfigLoaderAsync(projectRoot, ignoredFile, /* skipPlugins */ true),
    ]);
    result.config = config;
    result.loadedModules = diffLoadedModules(modulesWithPlugins ?? [], modulesWithoutPlugins ?? []);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.warn(`Cannot get Expo config from an Expo project - ${e.message}: `, e.stack);
    }
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true });
    } catch {}
  }

  return result;
}

async function spawnConfigLoaderAsync(
  projectRoot: string,
  ignoredFile: string,
  skipPlugins: boolean
): Promise<{ config: ProjectConfig | null; loadedModules: LoadedModuleSource[] | null }> {
  const args = [getExpoConfigLoaderPath(), path.resolve(projectRoot), ignoredFile];
  if (skipPlugins) {
    args.push('--skipPlugins');
  }
  const { message } = await spawnWithIpcAsync('node', args, { cwd: projectRoot });
  return JSON.parse(message);
}

/**
 * Keep only the config-plugin modules attributable to applying plugins.
 *
 * Anything that also loads when plugins are skipped is the config-loading framework and is dropped.
 * In-repo files are always kept regardless of the diff, so a local plugin imported at the top of
 * `app.config` (which loads during config evaluation, not plugin application) is never lost.
 */
export function diffLoadedModules(
  withPlugins: LoadedModuleSource[],
  withoutPlugins: LoadedModuleSource[]
): LoadedModuleSource[] {
  const skippedKeys = new Set(withoutPlugins.map(getLoadedModuleKey));
  return withPlugins.filter(
    (source) => isInRepoLoadedModule(source) || !skippedKeys.has(getLoadedModuleKey(source))
  );
}

/** Stable identity of a loaded module: its file path, or its id for a virtual module. */
function getLoadedModuleKey(source: LoadedModuleSource): string {
  return source.type === 'file' ? source.path : source.id;
}

/** Whether a loaded module is a project-local file (e.g. a local config plugin) rather than a dependency. */
function isInRepoLoadedModule(source: LoadedModuleSource): boolean {
  const key = getLoadedModuleKey(source);
  // `..` means the path escaped the project root (e.g. a hoisted or linked dependency).
  return !key.startsWith('..') && !key.includes('node_modules');
}

/**
 * Create a temporary file with ignored paths from options that will be read by the ExpoConfigLoader.
 */
async function createTempIgnoredFileAsync(
  tmpDir: string,
  options: NormalizedOptions
): Promise<string> {
  const ignoredFile = path.join(tmpDir, '.fingerprintignore');
  const ignorePaths = options.ignorePathMatchObjects.map((match) => match.pattern);
  await fs.writeFile(ignoredFile, ignorePaths.join('\n'));
  return ignoredFile;
}
