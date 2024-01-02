import { type ExpoConfig } from '@expo/config';
import { type ModPlatform } from '@expo/config-plugins';
import spawnAsync from '@expo/spawn-async';
import fs from 'fs/promises';
import path from 'path';

import { configureProjectAsync } from '../prebuild/configureProjectAsync';
import { resolveTemplateOption } from '../prebuild/resolveOptions';
import { cloneTemplateAndCopyToProjectAsync } from '../prebuild/updateFromTemplate';
import { directoryExistsAsync } from '../utils/dir';

/**
 * Generates native projects for the given platforms.
 * This step is similar to the `expo prebuild` command but removes some validation.
 */
export async function generateNativeProjectsAsync(
  projectRoot: string,
  exp: ExpoConfig,
  options: {
    /** List of platforms to prebuild. */
    platforms: ModPlatform[];
    /** URL or file path to the prebuild template. */
    template?: string;
    /** Directory to write the template to before copying into the project. */
    templateDirectory: string;
  }
) {
  // Create native projects from template.
  await cloneTemplateAndCopyToProjectAsync({
    exp,
    projectRoot,
    template: options.template != null ? resolveTemplateOption(options.template) : undefined,
    templateDirectory: options.templateDirectory,
    platforms: options.platforms,
  });

  // Apply config-plugins to native projects.
  await configureProjectAsync(projectRoot, {
    platforms: options.platforms,
    exp,
  });

  // Install CocoaPods is a must on ios because some changes are happening in the `pod install` stage.
  // That would minimize the diff between the native projects.
  if (options.platforms.includes('ios')) {
    const { installCocoaPodsAsync } = await import('../utils/cocoapods.js');
    await installCocoaPodsAsync(projectRoot);
  }
}

/**
 * Sanity check for the native project before attempting to run uneject.
 */
export async function platformSanityCheckAsync({
  exp,
  projectRoot,
  platform,
}: {
  exp: ExpoConfig;
  projectRoot: string;
  platform: ModPlatform;
}): Promise<void> {
  // Check platform directory exists and is not empty.
  const platformDir = path.join(projectRoot, platform);
  if (!(await directoryExistsAsync(platformDir))) {
    throw new Error(`Platform directory does not exist: ${platformDir}`);
  }
  const files = await fs.readdir(platformDir);
  if (files.length === 0) {
    throw new Error(`Platform directory is empty: ${platformDir}`);
  }

  // Check package and bundle identifier are defined.
  if (platform === 'android' && !exp.android?.package) {
    throw new Error(
      `android.package is not defined in your app config. Please define it before running this command.`
    );
  }
  if (platform === 'ios' && !exp.ios?.bundleIdentifier) {
    throw new Error(
      `ios.bundleIdentifier is not defined in your app config. Please define it before running this command.`
    );
  }

  // Check if git is installed.
  try {
    await spawnAsync('git', ['--version'], { stdio: 'ignore' });
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      e.message += `\nGit is required to run this command. Install Git and try again.`;
    }
    throw e;
  }
}
