import spawnAsync from '@expo/spawn-async';
import { type ExpoConfig } from 'expo/config';
import { type ModPlatform } from 'expo/config-plugins';
import fs from 'fs/promises';
import path from 'path';

import { directoryExistsAsync } from './dir';
import { resolveFromExpoCli } from './resolveFromExpoCli';

/**
 * Generates native projects for the given platforms.
 * This step is similar to the `expo prebuild` command but removes some validation.
 * @return The checksum of the template used to generate the native projects.
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
): Promise<string> {
  const { configureProjectAsync } = require(
    resolveFromExpoCli(projectRoot, 'build/src/prebuild/configureProjectAsync')
  );
  const { resolveTemplateOption } = require(
    resolveFromExpoCli(projectRoot, 'build/src/prebuild/resolveOptions')
  );
  const { cloneTemplateAndCopyToProjectAsync } = require(
    resolveFromExpoCli(projectRoot, 'build/src/prebuild/updateFromTemplate')
  );

  // Create native projects from template.
  const { templateChecksum } = await cloneTemplateAndCopyToProjectAsync({
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
    const { installCocoaPodsAsync } = require(
      resolveFromExpoCli(projectRoot, 'build/src/utils/cocoapods')
    ) as typeof import('@expo/cli/src/utils/cocoapods');
    await installCocoaPodsAsync(projectRoot);
  }

  return templateChecksum;
}

/**
 * Sanity check for the native project before attempting to run patch-project.
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
