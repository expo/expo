import type { JSONArray, JSONObject, JSONValue } from '@expo/json-file';
import fs from 'fs-extra';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';

import { setupExpoRepoAsync } from './ExpoRepo.js';
import { REACT_NATIVE_TRANSITIVE_DEPENDENCIES } from './Packages.js';
import { runAsync } from './Processes.js';

const require = createRequire(import.meta.url);
const { default: JsonFile } = require('@expo/json-file') as typeof import('@expo/json-file');

export interface ProjectProperties {
  /** The Android applicationId and iOS bundleIdentifier. */
  appId: string;

  /** Enable the New Architecture mode. */
  newArchEnabled: boolean;

  /** react-native nightly version */
  nightlyVersion: string;

  /** The template to use when creating the project. @default "blank-typescript" */
  template?: string;

  /** The template version on npm. @default "canary" */
  templateVersion?: string;

  /** Whether to use local expo/expo repository rather than clone a new one */
  useExpoRepoPath: string | undefined;
}

/**
 * Create a new Expo app at the given path.
 */
export async function createExpoApp(
  projectRoot: string,
  props: ProjectProperties
): Promise<string> {
  const template = props.template ?? 'blank-typescript';
  const templateVersion = props.templateVersion ?? 'canary';
  if (await fs.pathExists(projectRoot)) {
    throw new Error(`Project already exists at ${projectRoot}`);
  }
  await runAsync('bunx', [
    'create-expo-app',
    projectRoot,
    '--no-install',
    `--template`,
    `${template}@${templateVersion}`,
  ]);

  const expoRepoPath = await setupExpoRepoAsync(
    projectRoot,
    props.useExpoRepoPath,
    props.nightlyVersion
  );

  await setupProjectPackageJsonAsync(projectRoot, expoRepoPath, props.nightlyVersion);
  await setupMetroConfigAsync(projectRoot, expoRepoPath);
  await setupAppJsonAsync(projectRoot, {
    appId: props.appId,
    newArchEnabled: props.newArchEnabled,
  });

  return expoRepoPath;
}

/**
 * Setup package.json in the project for resolutions, workspaces and so on.
 */
async function setupProjectPackageJsonAsync(
  projectRoot: string,
  expoRepoPath: string,
  nightlyVersion: string
) {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = await JsonFile.readAsync(packageJsonPath);

  const scripts: Record<string, string> = (packageJson.scripts as Record<string, string>) ?? {};
  scripts['postinstall'] = 'bun --cwd expo postinstall';

  let workspacePrefix: string;
  const relativePath = path.relative(projectRoot, expoRepoPath);
  if (relativePath.startsWith('..')) {
    workspacePrefix = expoRepoPath;
  } else {
    workspacePrefix = relativePath;
  }

  const resolutions: Record<string, string> =
    (packageJson.resolutions as Record<string, string>) ?? {};
  for (const name of REACT_NATIVE_TRANSITIVE_DEPENDENCIES) {
    resolutions[name] = `${nightlyVersion}`;
  }
  await JsonFile.mergeAsync(packageJsonPath, {
    // Add workspaces
    workspaces: [`${workspacePrefix}/packages/*`, `${workspacePrefix}/packages/@expo/*`],

    // Exclude templates from autolinking
    expo: {
      autolinking: {
        exclude: ['expo-face-detector', 'expo-module-template', 'expo-module-template-local'],
      },
    },

    // Pin the versions of transitive dependencies
    resolutions,

    // Add postinstall script
    scripts,
  });
}

/**
 * Setup the metro.config.js for monorepo.
 */
async function setupMetroConfigAsync(projectRoot: string, expoRepoPath: string) {
  await fs.writeFile(
    path.join(projectRoot, 'metro.config.js'),
    `\
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.watchFolders = [
  ...config.watchFolders ?? [],
  __dirname,
  '${expoRepoPath}',
];

config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths ?? [],
  '${expoRepoPath}/node_modules',
];

module.exports = config;`
  );
}

export async function prebuildAppAsync(projectRoot: string, templateTarballPath: string) {
  await runAsync('npx', ['expo', 'prebuild', '--no-install', '--template', templateTarballPath], {
    cwd: projectRoot,
  });
}

export async function installCocoaPodsAsync(projectRoot: string) {
  await runAsync('pod', ['install'], { cwd: path.join(projectRoot, 'ios') });
}

/**
 * Setup app.json
 */
async function setupAppJsonAsync(
  projectRoot: string,
  { appId, newArchEnabled }: { appId: string; newArchEnabled: boolean }
) {
  const appJsonPath = path.join(projectRoot, 'app.json');
  const appJson = await JsonFile.readAsync(appJsonPath);

  const exp = appJson.expo;
  assert(isJSONObject(exp));
  const sectionAndroid = exp.android ?? {};
  const sectionIos = exp.ios ?? {};
  assert(isJSONObject(sectionAndroid));
  assert(isJSONObject(sectionIos));

  // Add app id
  sectionAndroid.package = appId;
  sectionIos.bundleIdentifier = appId;

  const plugins = exp.plugins ?? [];
  assert(isJSONArray(plugins));
  // Push plugins if any

  // Add updates config
  exp.runtimeVersion = '1.0.0';

  exp.android = sectionAndroid;
  exp.ios = sectionIos;
  exp.plugins = plugins;
  exp.newArchEnabled = newArchEnabled;
  await JsonFile.writeAsync(appJsonPath, appJson);
}

function isJSONObject(value: JSONValue | undefined): value is JSONObject {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isJSONArray(value: JSONValue | undefined): value is JSONArray {
  return value != null && Array.isArray(value);
}
