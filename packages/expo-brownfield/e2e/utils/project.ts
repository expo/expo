import spawnAsync from '@expo/spawn-async';
import { glob } from 'glob';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  executeCommandAsync,
  executeCreateExpoCLIAsync,
  executeExpoCLIAsync,
  sleep,
} from './process';
import type { PluginProps, TemplateEntry } from './types';

const PROJECT_NAME = 'testapp';
const TEMP_DIR = process.env.EXPO_E2E_TEMP_DIR
  ? path.resolve(process.env.EXPO_E2E_TEMP_DIR)
  : fs.realpathSync(os.tmpdir());

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
    await addPlugin(projectRoot);
    if (prebuild) {
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

  appConfig.expo.experiments.autolinkingModuleResolution = true;

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

  let tarballs = await glob('*.tgz', { cwd: templatePath });
  if (tarballs.length === 0) {
    await executeCommandAsync(templatePath, 'pnpm', ['pack', '--json']);
    tarballs = await glob('*.tgz', { cwd: templatePath });
    if (tarballs.length === 0) {
      throw new Error(`No tarballs found in template directory: ${templatePath}`);
    }
  }

  await executeCreateExpoCLIAsync(at, [
    projectName,
    '--template',
    path.join(templatePath, tarballs[0]),
    '--no-install',
  ]);
};

const listWorkspaces = async (): Promise<Record<string, string>> => {
  const { stdout } = await spawnAsync('pnpm', ['list', '--depth=-1', '-r', '--json'], {
    cwd: path.join(__dirname, '../../'),
  });
  const workspaces: { name: string; path: string; }[] = JSON.parse(stdout);
  return workspaces.reduce((acc, entry) => {
    acc[entry.name] = entry.path;
    return acc;
  }, {} as Record<string, string>);
};

/**
 * Install `expo-brownfield` package from a tarball
 */
const installPackage = async (projectRoot: string) => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'));

  packageJson.resolutions ??= {};
  packageJson.dependencies ??= {};

  // Strip npm_config_minimum_release_age inherited from the monorepo's pnpm-workspace.yaml,
  // as it blocks recently published packages without the matching exclusion list.
  const { npm_config_minimum_release_age, ...processEnv } = process.env;

  const packageRoot = path.join(__dirname, '../../');
  packageJson.resolutions['expo-brownfield'] = `link:${path.relative(projectRoot, packageRoot)}`;
  packageJson.dependencies['expo-brownfield'] = '*';

  // NOTE(@kitten): Forcefully links all monorepo packages
  // The tests will still pass without this in this case for expo-brownfield, but linking
  // ensures the prebuild logic is tested too and this installs faster
  const workspaces = await listWorkspaces();
  for (const name in packageJson.dependencies) {
    if (workspaces[name]) {
      packageJson.resolutions[name] = `link:${path.relative(projectRoot, workspaces[name])}`;
      packageJson.dependencies[name] = '*';
    }
  }
  for (const name in packageJson.devDependencies) {
    if (workspaces[name]) {
      packageJson.resolutions[name] = `link:${path.relative(projectRoot, workspaces[name])}`;
      packageJson.dependencies[name] = '*';
    }
  }

  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

  await spawnAsync('pnpm', ['install'], {
    cwd: projectRoot,
    stdio: 'pipe',
    env: processEnv,
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
