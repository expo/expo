import spawnAsync from '@expo/spawn-async';
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import tempDir from 'temp-dir';

import { executeCreateExpoCLIAsync, executeExpoCLIAsync, sleep } from './process';
import type { PluginProps, TemplateEntry } from './types';

const PROJECT_NAME = 'testapp';
const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : tempDir;

export const projectName = (suffix: string) => PROJECT_NAME + suffix;

/**
 * Create a temporary project for testing
 */
export const createTempProject = async (
  suffix: string,
  prebuild: boolean = false,
  install: boolean = false
): Promise<string> => {
  const projectRoot = path.join(TEMP_DIR, projectName(suffix));
  await removeProject(projectRoot);

  try {
    await createProjectWithTemplate(TEMP_DIR, projectName(suffix));
    await installPackage(projectRoot);
    if (prebuild) {
      await addPlugin(projectRoot);
      await prebuildProject(projectRoot, undefined, install);
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
  const projectRoot = path.join(TEMP_DIR, projectName(suffix));
  await removeProject(projectRoot);
};

/**
 * Add the Expo Brownfield plugin to the project
 */
export const addPlugin = async (
  projectRoot: string,
  props?: PluginProps,
  android: Record<string, any> = {}
) => {
  const appJsonPath = path.join(projectRoot, 'app.json');
  if (!fs.existsSync(appJsonPath)) {
    throw new Error(`App.json not found: ${appJsonPath}`);
  }

  const appConfig = JSON.parse(await fs.promises.readFile(appJsonPath, 'utf8'));
  if (!appConfig?.expo) {
    throw new Error(`App.json is missing the 'expo' object`);
  }

  const plugins = filterOutPlugin(appConfig.expo.plugins);

  const expoBrownfieldPlugin = props ? ['expo-brownfield', props] : 'expo-brownfield';
  plugins.push(expoBrownfieldPlugin);

  appConfig.expo.plugins = plugins;
  appConfig.expo.android = {
    ...appConfig.expo.android,
    ...android,
  };

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
  const packageRoot = path.join(__dirname, '../../');
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

  // Use --legacy-peer-deps for better stability
  await spawnAsync('npm', ['install', packageTarball, '--legacy-peer-deps'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });
};

/**
 * Prebuild the project
 */
export const prebuildProject = async (
  projectRoot: string,
  platform?: 'android' | 'ios',
  install: boolean = false
) => {
  const platformArgs = platform ? ['--platform', platform] : [];
  const noInstallArgs = install ? [] : ['--no-install'];
  await executeExpoCLIAsync(projectRoot, [
    'prebuild',
    '--clean',
    ...noInstallArgs,
    ...platformArgs,
  ]);
};

/**
 * Filters out the plugin from the app.json plugins array
 */
const filterOutPlugin = (plugins?: (any[] | string)[]) => {
  if (!plugins || plugins.length === 0) {
    return [];
  }

  return plugins.filter(
    (plugin) =>
      (Array.isArray(plugin) && plugin[0] !== 'expo-brownfield') ||
      (!Array.isArray(plugin) && plugin !== 'expo-brownfield')
  );
};

/**
 * Create template overrides for the brownfield plugin
 */
export const createTemplateOverrides = async (projectRoot: string, entries: TemplateEntry[]) => {
  const templatesDir = path.join(projectRoot, '.brownfield-templates');
  if (fs.existsSync(templatesDir)) {
    await fs.promises.rm(templatesDir, { recursive: true, force: true });
  }
  await fs.promises.mkdir(templatesDir, { recursive: true });

  for (const entry of entries) {
    const subdirectoryPath = entry.subdirectory
      ? path.join(templatesDir, entry.subdirectory)
      : undefined;
    if (subdirectoryPath && !fs.existsSync(subdirectoryPath)) {
      await fs.promises.mkdir(subdirectoryPath);
    }

    const templatePath = path.join(subdirectoryPath ?? templatesDir, entry.filename);
    await fs.promises.writeFile(templatePath, entry.content);
  }
};
