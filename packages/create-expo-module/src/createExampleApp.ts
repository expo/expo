import spawnAsync from '@expo/spawn-async';
import fs from 'fs-extra';
import getenv from 'getenv';
import os from 'os';
import path from 'path';

import { installDependencies } from './packageManager';
import { PackageManagerName } from './resolvePackageManager';
import { SubstitutionData } from './types';
import { newStep } from './utils/ora';

const debug = require('debug')('create-expo-module:createExampleApp') as typeof console.log;

// These dependencies will be removed from the example app (`expo init` adds them)
const DEPENDENCIES_TO_REMOVE = ['expo-status-bar', 'expo-splash-screen'];
const EXPO_BETA = getenv.boolish('EXPO_BETA', false);

/**
 * Initializes a new Expo project as an example app.
 */
export async function createExampleApp(
  data: SubstitutionData,
  targetDir: string,
  packageManager: PackageManagerName
): Promise<void> {
  // Package name for the example app
  const exampleProjectSlug = `${data.project.slug}-example`;

  // `expo init` creates a new folder with the same name as the project slug
  const appTmpPath = path.join(targetDir, exampleProjectSlug);

  // Path to the target example dir
  const appTargetPath = path.join(targetDir, 'example');

  if (!(await fs.pathExists(appTargetPath))) {
    // The template doesn't include the example app, so just skip this phase
    return;
  }

  await newStep('Initializing the example app', async (step) => {
    const templateVersion = EXPO_BETA ? 'next' : 'latest';
    const template = `expo-template-blank-typescript@${templateVersion}`;
    debug(`Using example template: ${template}`);
    const command = [
      'create',
      'expo-app',
      '--',
      exampleProjectSlug,
      '--template',
      template,
      '--yes',
    ];
    try {
      await spawnAsync(packageManager, command, {
        cwd: targetDir,
      });
    } catch (error: any) {
      throw new Error(
        `${command.join(' ')} failed with exit code: ${error?.status}.\n\nError stack:\n${error?.stderr}`
      );
    }

    step.succeed('Initialized the example app');
  });

  await newStep('Configuring the example app', async (step) => {
    // "example" folder already exists and contains template files,
    // that should replace these created by `expo init`.
    await moveFiles(appTargetPath, appTmpPath);

    // Cleanup the "example" dir
    await fs.rmdir(appTargetPath);

    // Clean up the ".git" from example app
    // note, this directory has contents, rmdir will throw
    await fs.remove(path.join(appTmpPath, '.git'));

    // Move the temporary example app to "example" dir
    await fs.rename(appTmpPath, appTargetPath);

    await addMissingAppConfigFields(appTargetPath, data);

    step.succeed('Configured the example app');
  });

  await prebuildExampleApp(appTargetPath);

  await modifyPackageJson(appTargetPath);

  await newStep('Installing dependencies in the example app', async (step) => {
    await installDependencies(packageManager, appTargetPath);
    if (os.platform() === 'darwin') {
      await podInstall(appTargetPath);
      step.succeed('Installed dependencies in the example app');
    } else {
      step.succeed('Installed dependencies in the example app (skipped installing CocoaPods)');
    }
  });
}

/**
 * Copies files from one directory to another.
 */
async function moveFiles(fromPath: string, toPath: string): Promise<void> {
  for (const file of await fs.readdir(fromPath)) {
    await fs.move(path.join(fromPath, file), path.join(toPath, file), {
      overwrite: true,
    });
  }
}

/**
 * Adds missing configuration that are required to run `npx expo prebuild`.
 */
async function addMissingAppConfigFields(appPath: string, data: SubstitutionData): Promise<void> {
  const appConfigPath = path.join(appPath, 'app.json');
  const appConfig = await fs.readJson(appConfigPath);
  const appId = `${data.project.package}.example`;

  // Android package name needs to be added to app.json
  if (!appConfig.expo.android) {
    appConfig.expo.android = {};
  }
  appConfig.expo.android.package = appId;

  // Specify iOS bundle identifier
  if (!appConfig.expo.ios) {
    appConfig.expo.ios = {};
  }
  appConfig.expo.ios.bundleIdentifier = appId;

  await fs.writeJson(appConfigPath, appConfig, {
    spaces: 2,
  });
}

/**
 * Applies necessary changes to **package.json** of the example app.
 * It means setting the autolinking config and removing unnecessary dependencies.
 */
async function modifyPackageJson(appPath: string): Promise<void> {
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  if (!packageJson.expo) {
    packageJson.expo = {};
  }

  // Set the native modules dir to the root folder,
  // so that the autolinking can detect and link the module.
  packageJson.expo.autolinking = {
    nativeModulesDir: '..',
  };

  // Remove unnecessary dependencies
  for (const dependencyToRemove of DEPENDENCIES_TO_REMOVE) {
    delete packageJson.dependencies[dependencyToRemove];
  }

  await fs.writeJson(packageJsonPath, packageJson, {
    spaces: 2,
  });
}

/**
 * Runs `npx expo prebuild` in the example app.
 */
async function prebuildExampleApp(exampleAppPath: string): Promise<void> {
  await newStep('Prebuilding the example app', async (step) => {
    await spawnAsync('npx', ['expo', 'prebuild', '--no-install'], {
      cwd: exampleAppPath,
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    step.succeed('Prebuilt the example app');
  });
}

/**
 * Runs `pod install` in the iOS project at the given path.
 */
async function podInstall(appPath: string): Promise<void> {
  await spawnAsync('pod', ['install'], {
    cwd: path.join(appPath, 'ios'),
    stdio: ['ignore', 'ignore', 'pipe'],
  });
}
