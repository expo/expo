import spawnAsync from '@expo/spawn-async';
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import tempDir from 'temp-dir';

import { executeCreateExpoCLIAsync, executeExpoCLIAsync, sleep } from './process';

const PROJECT_NAME = 'testapp';
const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : tempDir;

/**
 * Create a temporary project for testing
 */
export const createTempProject = async (
  suffix: string,
  prebuild: boolean = false
): Promise<string> => {
  const projectRoot = path.join(TEMP_DIR, PROJECT_NAME + suffix);
  await removeProject(projectRoot);

  try {
    await createProjectWithTemplate(TEMP_DIR, PROJECT_NAME + suffix);
    await installPackage(projectRoot);
    if (prebuild) {
      await addPlugin(projectRoot);
      await executeExpoCLIAsync(projectRoot, ['prebuild', '--clean']);
    }
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
  await removeProject(projectRoot);
};

/**
 * Add the Expo Brownfield plugin to the project
 */
const addPlugin = async (projectRoot: string) => {
  const appJsonPath = path.join(projectRoot, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    throw new Error(`App.json not found: ${appJsonPath}`);
  }

  const appConfig = JSON.parse(await fs.promises.readFile(appJsonPath, 'utf8'));
  appConfig.expo.plugins = appConfig?.expo?.plugins
    ? [...appConfig.expo.plugins, 'expo-brownfield']
    : ['expo-brownfield'];
  await fs.promises.writeFile(appJsonPath, JSON.stringify(appConfig, null, 2));
};

/**
 * Remove the Expo Brownfield plugin from the project
 * Retry if we get node ENOENT error
 */
const removeProject = async (projectRoot: string) => {
  if (!fs.existsSync(projectRoot)) {
    return;
  }

  try {
    await fs.promises.rm(projectRoot, { recursive: true, force: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      await sleep(2500);
      await fs.promises.rm(projectRoot, { recursive: true, force: true });
    }
    throw error;
  }
};

/**
 * Create a project with a template and specified name
 * Uses local versions of Create Expo and expo-default-template
 */
const createProjectWithTemplate = async (at: string, projectName: string) => {
  const templatePath = path.join(__dirname, '../../../../templates/expo-template-default');
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template directory not found at: ${templatePath}`);
  }

  const tarballs = await glob('*.tgz', { cwd: templatePath });
  if (tarballs.length === 0) {
    throw new Error(`No tarballs found in template directory: ${templatePath}`);
  }

  await executeCreateExpoCLIAsync(at, [
    projectName,
    '--template',
    path.join(templatePath, tarballs[0]),
  ]);
};

/**
 * Install `expo-brownfield` package from a tarball
 */
const installPackage = async (projectRoot: string) => {
  const packageRoot = path.join(__dirname, '../..');
  const tarballs = await glob('*.tgz', { cwd: packageRoot });
  if (tarballs.length !== 1) {
    throw new Error(
      `Expected a single tarball to be created for 'expo-brownfield', received: ${tarballs.length}`
    );
  }

  const packageTarball = tarballs[0];
  const packageTarballPath = path.join(packageRoot, packageTarball);
  await fs.promises.cp(packageTarballPath, path.join(projectRoot, packageTarball), {
    recursive: true,
    force: true,
  });

  await spawnAsync('npm', ['install', packageTarball], { cwd: projectRoot, stdio: 'pipe' });
};
