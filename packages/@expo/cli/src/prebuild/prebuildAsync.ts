import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import chalk from 'chalk';

import { clearNativeFolder, promptToClearMalformedNativeProjectsAsync } from './clearNativeFolder';
import { configureProjectAsync } from './configureProjectAsync';
import { ensureConfigAsync } from './ensureConfigAsync';
import { assertPlatforms, ensureValidPlatforms, resolveTemplateOption } from './resolveOptions';
import { updateFromTemplateAsync } from './updateFromTemplate';
import { installAsync } from '../install/installAsync';
import { Log } from '../log';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';
import { clearNodeModulesAsync } from '../utils/nodeModules';
import { logNewSection } from '../utils/ora';
import { profile } from '../utils/profile';
import { confirmAsync } from '../utils/prompts';

const debug = require('debug')('expo:prebuild') as typeof console.log;

export type PrebuildResults = {
  /** Expo config. */
  exp: ExpoConfig;
  /** Indicates if the process created new files. */
  hasNewProjectFiles: boolean;
  /** The platforms that were prebuilt. */
  platforms: ModPlatform[];
  /** Indicates if pod install was run. */
  podInstall: boolean;
  /** Indicates if node modules were installed. */
  nodeInstall: boolean;
};

/**
 * Entry point into the prebuild process, delegates to other helpers to perform various steps.
 *
 * 0. Attempt to clean the project folders.
 * 1. Create native projects (ios, android).
 * 2. Install node modules.
 * 3. Apply config to native projects.
 * 4. Install CocoaPods.
 */
export async function prebuildAsync(
  projectRoot: string,
  options: {
    /** Should install node modules and cocoapods. */
    install?: boolean;
    /** List of platforms to prebuild. */
    platforms: ModPlatform[];
    /** Should delete the native folders before attempting to prebuild. */
    clean?: boolean;
    /**
     * Should reset the files controlled by modifiers during prebuild.
     *
     * **WARNING:** This will not reset dangerous modifications!
     */
    cleanSoft?: boolean;
    /** URL or file path to the prebuild template. */
    template?: string;
    /** Name of the node package manager to install with. */
    packageManager?: {
      npm?: boolean;
      yarn?: boolean;
      pnpm?: boolean;
      bun?: boolean;
    };
    /** List of node modules to skip updating. */
    skipDependencyUpdate?: string[];
  }
): Promise<PrebuildResults | null> {
  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  if (options.clean) {
    const { maybeBailOnGitStatusAsync } = await import('../utils/git.js');
    // Clean the project folders...
    if (await maybeBailOnGitStatusAsync()) {
      return null;
    }
    // Clear the native folders before syncing
    await clearNativeFolder(projectRoot, options.platforms);
  } else {
    // Check if the existing project folders are malformed.
    await promptToClearMalformedNativeProjectsAsync(projectRoot, options.platforms);
  }

  // Warn if the project is attempting to prebuild an unsupported platform (iOS on Windows).
  options.platforms = ensureValidPlatforms(options.platforms);
  // Assert if no platforms are left over after filtering.
  assertPlatforms(options.platforms);

  // Get the Expo config, create it if missing.
  const { exp, pkg } = await ensureConfigAsync(projectRoot, { platforms: options.platforms });

  // Create native projects from template.
  const {
    templateDirectory,
    hasNewProjectFiles,
    needsPodInstall,
    templateChecksum,
    changedDependencies,
  } = await updateFromTemplateAsync(projectRoot, {
    exp,
    pkg,
    template: options.template != null ? resolveTemplateOption(options.template) : undefined,
    platforms: options.platforms,
    skipDependencyUpdate: options.skipDependencyUpdate,
  });

  // Install node modules
  if (options.install) {
    if (changedDependencies.length) {
      if (options.packageManager?.npm) {
        await clearNodeModulesAsync(projectRoot);
      }

      Log.log(chalk.gray(chalk`Dependencies in the {bold package.json} changed:`));
      Log.log(chalk.gray('  ' + changedDependencies.join(', ')));

      // Installing dependencies is a legacy feature from the unversioned
      // command. We know opt to not change dependencies unless a template
      // indicates a new dependency is required, or if the core dependencies are wrong.
      if (
        await confirmAsync({
          message: `Install the updated dependencies?`,
          initial: true,
        })
      ) {
        await installAsync([], {
          npm: !!options.packageManager?.npm,
          yarn: !!options.packageManager?.yarn,
          pnpm: !!options.packageManager?.pnpm,
          bun: !!options.packageManager?.bun,
          silent: !(env.EXPO_DEBUG || env.CI),
        });
      }
    }
  }

  // Apply Expo config to native projects. Prevent log-spew from ora when running in debug mode.
  const configSyncingStep: { succeed(text?: string): unknown; fail(text?: string): unknown } =
    env.EXPO_DEBUG
      ? {
          succeed(text) {
            Log.log(text!);
          },
          fail(text) {
            Log.error(text!);
          },
        }
      : logNewSection('Running prebuild');
  try {
    await profile(configureProjectAsync)(projectRoot, {
      platforms: options.platforms,
      templateProjectRoot: options.cleanSoft ? templateDirectory : undefined,
      exp,
      templateChecksum,
    });
    configSyncingStep.succeed('Finished prebuild');
  } catch (error) {
    configSyncingStep.fail('Prebuild failed');
    throw error;
  }

  // Install CocoaPods
  let podsInstalled: boolean = false;
  // err towards running pod install less because it's slow and users can easily run npx pod-install afterwards.
  if (options.platforms.includes('ios') && options.install && needsPodInstall) {
    const { installCocoaPodsAsync } = await import('../utils/cocoapods.js');

    podsInstalled = await installCocoaPodsAsync(projectRoot);
  } else {
    debug('Skipped pod install');
  }

  return {
    nodeInstall: !!options.install,
    podInstall: !podsInstalled,
    platforms: options.platforms,
    hasNewProjectFiles,
    exp,
  };
}
