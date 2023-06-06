import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';

import { installAsync } from '../install/installAsync';
import { env } from '../utils/env';
import { setNodeEnv } from '../utils/nodeEnv';
import { clearNodeModulesAsync } from '../utils/nodeModules';
import { logNewSection } from '../utils/ora';
import { profile } from '../utils/profile';
import { clearNativeFolder, promptToClearMalformedNativeProjectsAsync } from './clearNativeFolder';
import { configureProjectAsync } from './configureProjectAsync';
import { ensureConfigAsync } from './ensureConfigAsync';
import { assertPlatforms, ensureValidPlatforms, resolveTemplateOption } from './resolveOptions';
import { updateFromTemplateAsync } from './updateFromTemplate';

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
    };
    /** List of node modules to skip updating. */
    skipDependencyUpdate?: string[];
  }
): Promise<PrebuildResults | null> {
  setNodeEnv('development');
  require('@expo/env').load(projectRoot);

  if (options.clean) {
    const { maybeBailOnGitStatusAsync } = await import('../utils/git');
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
  const { templateDirectory, hasNewProjectFiles, needsPodInstall, hasNewDependencies } =
    await updateFromTemplateAsync(projectRoot, {
      exp,
      pkg,
      template: options.template != null ? resolveTemplateOption(options.template) : undefined,
      platforms: options.platforms,
      skipDependencyUpdate: options.skipDependencyUpdate,
    });

  // Install node modules
  if (options.install) {
    if (hasNewDependencies && options.packageManager?.npm) {
      await clearNodeModulesAsync(projectRoot);
    }

    await installAsync([], {
      npm: !!options.packageManager?.npm,
      yarn: !!options.packageManager?.yarn,
      pnpm: !!options.packageManager?.pnpm,
      silent: !(env.EXPO_DEBUG || env.CI),
    });
  }

  // Apply Expo config to native projects
  const configSyncingStep = logNewSection('Config syncing');
  try {
    await profile(configureProjectAsync)(projectRoot, {
      platforms: options.platforms,
      templateProjectRoot: options.cleanSoft ? templateDirectory : undefined,
    });
    configSyncingStep.succeed('Config synced');
  } catch (error) {
    configSyncingStep.fail('Config sync failed');
    throw error;
  }

  // Install CocoaPods
  let podsInstalled: boolean = false;
  // err towards running pod install less because it's slow and users can easily run npx pod-install afterwards.
  if (options.platforms.includes('ios') && options.install && needsPodInstall) {
    const { installCocoaPodsAsync } = await import('../utils/cocoapods');

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
