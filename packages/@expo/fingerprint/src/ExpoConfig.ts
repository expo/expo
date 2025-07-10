import type { ProjectConfig } from 'expo/config';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import resolveFrom from 'resolve-from';

import { getExpoConfigLoaderPath } from './ExpoConfigLoader';
import { type NormalizedOptions } from './Fingerprint.types';
import { spawnWithIpcAsync } from './utils/SpawnIPC';

/**
 * An out-of-process `expo/config` loader that can be used to get the Expo config and loaded modules.
 */
export async function getExpoConfigAsync(
  projectRoot: string,
  options: NormalizedOptions
): Promise<{
  config: ProjectConfig | null;
  loadedModules: string[] | null;
}> {
  const result = {
    config: null,
    loadedModules: null,
  };

  if (!resolveFrom.silent(path.resolve(projectRoot), 'expo/config')) {
    return result;
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-fingerprint-'));
  const ignoredFile = await createTempIgnoredFileAsync(tmpDir, options);
  try {
    const { message } = await spawnWithIpcAsync(
      'node',
      [getExpoConfigLoaderPath(), path.resolve(projectRoot), ignoredFile],
      { cwd: projectRoot }
    );
    const stdoutJson = JSON.parse(message);
    result.config = stdoutJson.config;
    result.loadedModules = stdoutJson.loadedModules;
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
