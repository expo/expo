import type { JSONArray, JSONObject, JSONValue } from '@expo/json-file';
import fs from 'fs-extra';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import path from 'node:path';

import { runAsync } from './Processes.js';

const require = createRequire(import.meta.url);
const { default: JsonFile } = require('@expo/json-file') as typeof import('@expo/json-file');

export interface ProjectProperties {
  /** The Android applicationId and iOS bundleIdentifier. */
  appId: string;

  /** Enable the New Architecture mode. */
  newArchEnabled: boolean;

  /** The template to use when creating the project. @default "blank-typescript" */
  template?: string;
}

/**
 * Create a new Expo app at the given path.
 */
export async function createExpoApp(
  projectRoot: string,
  expoRepoPath: string,
  props: ProjectProperties
) {
  const template = props.template ?? 'blank-typescript';
  if (await fs.pathExists(projectRoot)) {
    throw new Error(`Project already exists at ${projectRoot}`);
  }
  await runAsync('bunx', ['create-expo-app', projectRoot, '--no-install', `--template`, template]);
  await setupDependenciesAsync(projectRoot);
  await setupEntryAsync(projectRoot);
  await setupMetroConfigAsync(projectRoot, expoRepoPath);
  await setupAppJsonAsync(projectRoot, {
    appId: props.appId,
    newArchEnabled: props.newArchEnabled,
  });
}

/**
 * Purge dependencies and will setup later.
 */
async function setupDependenciesAsync(projectRoot: string) {
  await JsonFile.mergeAsync(path.join(projectRoot, 'package.json'), {
    dependencies: {},
  });
}

/**
 * Setup the entry point for monorepo.
 */
async function setupEntryAsync(projectRoot: string) {
  await fs.writeFile(
    path.join(projectRoot, 'index.js'),
    `\
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
`
  );
  await JsonFile.deleteKeyAsync(path.join(projectRoot, 'package.json'), 'main');
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

  // Add expo-build-properties plugin
  const plugins = exp.plugins ?? [];
  assert(isJSONArray(plugins));
  plugins.push(['expo-build-properties', { android: { newArchEnabled }, ios: { newArchEnabled } }]);

  // Add updates config
  exp.runtimeVersion = {
    policy: 'appVersion',
  };

  exp.android = sectionAndroid;
  exp.ios = sectionIos;
  exp.plugins = plugins;
  await JsonFile.writeAsync(appJsonPath, appJson);
}

function isJSONObject(value: JSONValue | undefined): value is JSONObject {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isJSONArray(value: JSONValue | undefined): value is JSONArray {
  return value != null && Array.isArray(value);
}
