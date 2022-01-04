import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';

import * as Log from '../log';
import { isNonInteractive } from '../utils/env';
import { logNewSection } from '../utils/ora';
import { confirmAsync } from '../utils/prompts';

export async function directoryExistsAsync(file: string): Promise<boolean> {
  return (await fs.stat(file).catch(() => null))?.isDirectory() ?? false;
}

export async function clearNativeFolder(projectRoot: string, folders: string[]) {
  const step = logNewSection(`Clearing ${folders.join(', ')}`);
  try {
    await Promise.all(folders.map((folderName) => fs.remove(path.join(projectRoot, folderName))));
    step.succeed(`Cleared ${folders.join(', ')} code`);
  } catch (error) {
    step.fail(`Failed to delete ${folders.join(', ')} code: ${error.message}`);
    throw error;
  }
}

export async function hasRequiredAndroidFilesAsync(projectRoot: string) {
  try {
    await Promise.all([
      AndroidConfig.Paths.getAppBuildGradleAsync(projectRoot),
      AndroidConfig.Paths.getProjectBuildGradleAsync(projectRoot),
      AndroidConfig.Paths.getAndroidManifestAsync(projectRoot),
      AndroidConfig.Paths.getMainApplicationAsync(projectRoot),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function isAndroidProjectValidAsync(projectRoot: string) {
  // Only perform the check if the native folder is present.
  if (!(await directoryExistsAsync(path.join(projectRoot, 'android')))) {
    return true;
  }
  return hasRequiredAndroidFilesAsync(projectRoot);
}

export async function hasRequiredIOSFilesAsync(projectRoot: string) {
  try {
    // If any of the following required files are missing, then the project is malformed.
    await Promise.all([
      IOSConfig.Paths.getAppDelegate(projectRoot),
      IOSConfig.Paths.getAllXcodeProjectPaths(projectRoot),
      IOSConfig.Paths.getAllInfoPlistPaths(projectRoot),
      IOSConfig.Paths.getAllPBXProjectPaths(projectRoot),
    ]);
    return true;
  } catch {
    return false;
  }
}

async function isIOSProjectValidAsync(projectRoot: string) {
  // Only perform the check if the native folder is present.
  if (!(await directoryExistsAsync(path.join(projectRoot, 'ios')))) {
    return true;
  }
  return hasRequiredIOSFilesAsync(projectRoot);
}

export async function promptToClearMalformedNativeProjectsAsync(
  projectRoot: string,
  checkPlatforms: string[]
) {
  const [isAndroidValid, isIOSValid] = await Promise.all([
    checkPlatforms.includes('android')
      ? isAndroidProjectValidAsync(projectRoot)
      : Promise.resolve(true),
    checkPlatforms.includes('ios') ? isIOSProjectValidAsync(projectRoot) : Promise.resolve(true),
  ]);

  if (isAndroidValid && isIOSValid) {
    return;
  }

  const platforms = [!isAndroidValid && 'android', !isIOSValid && 'ios'].filter(
    Boolean
  ) as string[];

  const displayPlatforms = platforms.map((platform) => chalk.cyan(platform));
  // Prompt which platforms to reset.
  const message =
    platforms.length > 1
      ? `The ${displayPlatforms[0]} and ${displayPlatforms[1]} projects are malformed`
      : `The ${displayPlatforms[0]} project is malformed`;

  if (
    // If the process is non-interactive, default to clearing the malformed native project.
    // This would only happen on re-running eject.
    isNonInteractive() ||
    // Prompt to clear the native folders.
    (await confirmAsync({
      message: `${message}, would you like to clear the project files and reinitialize them?`,
      initial: true,
    }))
  ) {
    await clearNativeFolder(projectRoot, platforms);
  } else {
    // Warn the user that the process may fail.
    Log.warn('Continuing with malformed native projects');
  }
}
