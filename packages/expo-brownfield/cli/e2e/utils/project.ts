import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';
import tempDir from 'temp-dir';

import { createPackageTarball } from './package';

const PROJECT_NAME = 'testapp';

const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : tempDir;

/**
 * Create a temporary project for testing
 */
export const createTempProject = async (suffix: string = ''): Promise<string> => {
  // Create a temporary directory & initialize a new Expo project
  const projectRoot = path.join(TEMP_DIR, PROJECT_NAME + suffix);

  try {
    if (fs.existsSync(projectRoot)) {
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
    await spawnAsync('npx', ['create-expo-app', PROJECT_NAME + suffix], {
      cwd: TEMP_DIR,
      stdio: 'pipe',
    });

    // Create and install the package tarball
    const packageTarball = await createPackageTarball(projectRoot);
    if (!fs.existsSync(packageTarball)) {
      throw new Error(`Package tarball not found: ${packageTarball}`);
    }
    await spawnAsync('npm', ['install', packageTarball], { cwd: projectRoot, stdio: 'pipe' });
  } catch (error) {
    console.error(error);
    throw error;
  }

  return projectRoot;
};

/**
 * Clean up the temporary project
 */
export const cleanUpProject = async (suffix: string = ''): Promise<void> => {
  const projectRoot = path.join(TEMP_DIR, PROJECT_NAME + suffix);
  if (fs.existsSync(projectRoot)) {
    await fs.promises.rm(projectRoot, { recursive: true, force: true });
  }
};
