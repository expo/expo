import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
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

  if (!fs.existsSync(appTargetPath)) {
    // The template doesn't include the example app, so just skip this phase
    return;
  }

  await newStep('Initializing the example app', async (step) => {
    const templateVersion = EXPO_BETA ? 'next' : 'latest';
    const template = `expo-template-blank-typescript@${templateVersion}`;
    debug(`Using example template: ${template}`);
    const command = createCommand(packageManager, exampleProjectSlug, template);
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
    await fs.promises.rm(appTargetPath, { recursive: true, force: true });

    // Clean up the ".git" from example app
    // note, this directory has contents, rmdir will throw
    await fs.promises.rm(path.join(appTmpPath, '.git'), { recursive: true, force: true });

    // Move the temporary example app to "example" dir
    await fs.promises.rename(appTmpPath, appTargetPath);

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

function createCommand(
  packageManager: PackageManagerName,
  exampleProjectSlug: string,
  template: string
): string[] {
  const command = ['create', 'expo-app'];
  if (packageManager === 'npm') {
    command.push('--');
  }
  return command.concat([exampleProjectSlug, '--template', template, '--yes']);
}

/**
 * Moves files from one directory to another.
 */
async function moveFiles(fromPath: string, toPath: string): Promise<void> {
  // Make sure that the target directory exists
  await fs.promises.mkdir(toPath, { recursive: true });
  for (const file of await fs.promises.readdir(fromPath)) {
    // First, remove target, so there are no conflicts (explicit overwrite)
    await fs.promises.rm(path.join(toPath, file), { force: true, recursive: true });
    try {
      // Then, rename the file to move it to the destination
      await fs.promises.rename(path.join(fromPath, file), path.join(toPath, file));
    } catch (error: any) {
      if (error.code === 'EXDEV') {
        // If the file is on a different device/disk, copy it instead and delete the original
        await fs.promises.cp(fromPath, toPath, { errorOnExist: true, recursive: true });
        await fs.promises.rm(fromPath, { recursive: true, force: true });
      } else {
        throw error;
      }
    }
  }
}

/**
 * Adds missing configuration that are required to run `npx expo prebuild`.
 */
async function addMissingAppConfigFields(appPath: string, data: SubstitutionData): Promise<void> {
  const appConfigPath = path.join(appPath, 'app.json');
  const appConfigContent = await fs.promises.readFile(appConfigPath, 'utf8');
  const appConfig = JSON.parse(appConfigContent);
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

  await fs.promises.writeFile(appConfigPath, JSON.stringify(appConfig, null, 2), 'utf8');
}

/**
 * Applies necessary changes to **package.json** of the example app.
 * It means setting the autolinking config and removing unnecessary dependencies.
 */
async function modifyPackageJson(appPath: string): Promise<void> {
  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

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

  await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
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
