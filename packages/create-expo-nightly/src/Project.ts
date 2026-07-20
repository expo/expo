import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import { setupExpoRepoAsync } from './ExpoRepo.js';
import {
  type JSONArray,
  type JSONObject,
  type JSONValue,
  readJsonFileAsync,
  writeJsonFileAsync,
} from './JsonFile.js';
import { REACT_NATIVE_TRANSITIVE_DEPENDENCIES, getExpoPackageNamesAsync } from './Packages.js';
import { runAsync } from './Processes.js';

export interface ProjectProperties {
  /** The Android applicationId and iOS bundleIdentifier. */
  appId: string;

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
  if (fs.existsSync(projectRoot)) {
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
  const packageJson = await readJsonFileAsync(packageJsonPath);

  const resolutions: Record<string, string> =
    (packageJson.resolutions as Record<string, string>) ?? {};
  for (const name of REACT_NATIVE_TRANSITIVE_DEPENDENCIES) {
    resolutions[name] = `${nightlyVersion}`;
  }

  // Point repo dependencies at the local workspace copy so the build tests the
  // code under test, not the published canary. Only the `workspace:` protocol
  // forces this; pnpm won't link a workspace package whose version doesn't
  // satisfy the declared range, and the canary template pins different versions.
  const repoPackageNames = await getExpoPackageNamesAsync(expoRepoPath);

  for (const field of ['dependencies', 'devDependencies'] as const) {
    const deps = packageJson[field] as Record<string, string> | undefined;

    if (deps != null) {
      for (const name of Object.keys(deps)) {
        if (repoPackageNames.has(name)) {
          deps[name] = 'workspace:*';
        }
      }
    }
  }

  // Also force transitive repo packages (e.g. `expo-modules-autolinking`) to
  // the workspace copy, so pnpm can't pull a published version that lags it.
  for (const name of repoPackageNames) {
    resolutions[name] = 'workspace:*';
  }

  await writeJsonFileAsync(packageJsonPath, {
    ...packageJson,

    // Exclude templates from autolinking
    expo: {
      autolinking: {
        exclude: ['expo-module-template'],
      },
    },

    // Pin the versions of transitive dependencies
    resolutions,
  });

  // pnpm ignores the package.json `workspaces` field, so the repo packages must
  // be declared as workspace members here for the `workspace:*` specifiers to
  // resolve to local source.
  const relativePrefix = path.relative(projectRoot, expoRepoPath);
  const workspaceGlobs = [`${relativePrefix}/packages/*`, `${relativePrefix}/packages/@expo/*`];

  await fs.promises.writeFile(
    path.join(projectRoot, 'pnpm-workspace.yaml'),
    ['packages:', ...workspaceGlobs.map((glob) => `  - '${glob}'`), ''].join('\n')
  );
}

/**
 * Setup the metro.config.js for monorepo.
 */
async function setupMetroConfigAsync(projectRoot: string, expoRepoPath: string) {
  await fs.promises.writeFile(
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
  await runAsync('pnpm', ['expo', 'prebuild', '--no-install', '--template', templateTarballPath], {
    cwd: projectRoot,
  });
}

/**
 * Apply the Gradle tweaks needed to build the generated project against react-native nightlies.
 */
export async function setupGradleForNightlyAsync(projectRoot: string, expoRepoPath: string) {
  const nightlyGradleVersion = '9.4.1';

  // react-native nightlies can require a newer Gradle than the stable template ships with, so bump
  // the generated project's Gradle wrapper to a version recent enough to run their Android plugin.
  const wrapperPropertiesPath = path.join(
    projectRoot,
    'android',
    'gradle',
    'wrapper',
    'gradle-wrapper.properties'
  );

  const wrapperProperties = await fs.promises.readFile(wrapperPropertiesPath, 'utf8');

  await fs.promises.writeFile(
    wrapperPropertiesPath,
    wrapperProperties.replace(
      /^(distributionUrl=.*gradle-).*(-bin\.zip)$/m,
      `$1${nightlyGradleVersion}$2`
    )
  );

  const skipMetadataVersionCheck = 'freeCompilerArgs.add("-Xskip-metadata-version-check")';
  const packagesPath = path.join(expoRepoPath, 'packages');

  const expoModuleGradlePlugin = path.join(
    packagesPath,
    'expo-modules-core',
    'expo-module-gradle-plugin'
  );

  // The Expo Gradle plugins are compiled with an older Kotlin than the one bundled with that newer
  // Gradle, so skip the metadata check to let them compile against its newer kotlin-stdlib.
  const pluginRoots = [
    expoModuleGradlePlugin,
    path.join(packagesPath, 'expo-modules-autolinking', 'android', 'expo-gradle-plugin'),
  ];

  for (const pluginRoot of pluginRoots) {
    for await (const relativePath of fs.promises.glob('**/build.gradle.kts', { cwd: pluginRoot })) {
      const buildGradlePath = path.join(pluginRoot, relativePath);
      const contents = await fs.promises.readFile(buildGradlePath, 'utf8');

      if (!contents.includes(skipMetadataVersionCheck)) {
        const nextContents = contents.replace(
          /^(\s*)(jvmTarget\.set\(JvmTarget\.JVM_11\))$/m,
          `$1$2\n$1${skipMetadataVersionCheck}`
        );

        if (nextContents !== contents) {
          await fs.promises.writeFile(buildGradlePath, nextContents);
        }
      }
    }
  }

  // AGP 9 (pulled in by recent nightlies) ships built-in Kotlin support that clashes with the
  // template's explicit `kotlin.android` plugin, so drop it and let AGP's built-in Kotlin take over.
  const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
  const appBuildGradle = await fs.promises.readFile(appBuildGradlePath, 'utf8');

  await fs.promises.writeFile(
    appBuildGradlePath,
    appBuildGradle.replace(/^apply plugin: ["']org\.jetbrains\.kotlin\.android["']\r?\n/m, '')
  );

  // AGP 9 disables the `buildConfig` feature by default, but several Expo modules declare custom
  // BuildConfig fields. Enable it for every module through the shared plugin so they keep compiling.
  const androidLibraryExtensionPath = path.join(
    packagesPath,
    'expo-modules-core',
    'expo-module-gradle-plugin',
    'src',
    'main',
    'kotlin',
    'expo',
    'modules',
    'plugin',
    'android',
    'AndroidLibraryExtension.kt'
  );

  const androidLibraryExtension = await fs.promises.readFile(androidLibraryExtensionPath, 'utf8');

  if (!androidLibraryExtension.includes('buildFeatures.buildConfig = true')) {
    await fs.promises.writeFile(
      androidLibraryExtensionPath,
      androidLibraryExtension.replace(
        /^(\s*)(this\.compileSdk = compileSdk)$/m,
        '$1$2\n$1buildFeatures.buildConfig = true'
      )
    );
  }
}

export async function installCocoaPodsAsync(projectRoot: string) {
  await runAsync('pod', ['install'], { cwd: path.join(projectRoot, 'ios') });
}

/**
 * Setup app.json
 */
async function setupAppJsonAsync(projectRoot: string, { appId }: { appId: string }) {
  const appJsonPath = path.join(projectRoot, 'app.json');
  const appJson = await readJsonFileAsync(appJsonPath);

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
  await writeJsonFileAsync(appJsonPath, appJson);
}

function isJSONObject(value: JSONValue | undefined): value is JSONObject {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isJSONArray(value: JSONValue | undefined): value is JSONArray {
  return value != null && Array.isArray(value);
}
