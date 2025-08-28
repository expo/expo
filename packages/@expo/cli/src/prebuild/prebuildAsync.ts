import { ExpoConfig, getConfig } from '@expo/config';
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

  const { platforms } = getConfig(projectRoot).exp;
  if (platforms?.length) {
    // Filter out platforms that aren't in the app.json.
    const finalPlatforms = options.platforms.filter((platform) => platforms.includes(platform));
    if (finalPlatforms.length > 0) {
      options.platforms = finalPlatforms;
    } else {
      const requestedPlatforms = options.platforms.join(', ');
      Log.warn(
        chalk`⚠️  Requested prebuild for "${requestedPlatforms}", but only "${platforms.join(', ')}" is present in app config ("expo.platforms" entry). Continuing with "${requestedPlatforms}".`
      );
    }
  }

  await checkCNG(options.platforms, projectRoot);

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
  const { hasNewProjectFiles, needsPodInstall, templateChecksum, changedDependencies } =
    await updateFromTemplateAsync(projectRoot, {
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

async function checkCNG(platforms: ModPlatform[], projectRoot: string) {
  const { resolveWorkflowAsync } = await import('../utils/workflow.js');
  const { Log } = await import('../log.js');
  const chalk = await import('chalk');

  const nativePlatforms = platforms.filter(
    (platform) => platform === 'ios' || platform === 'android'
  );
  if (nativePlatforms.length === 0) return;

  const workflows: { platform: string; workflow: string }[] = [];

  for (const platform of nativePlatforms) {
    try {
      const workflow = await resolveWorkflowAsync(projectRoot, platform);
      workflows.push({ platform, workflow });
    } catch (error) {
      debug(`Could not determine workflow for ${platform}: ${error}`);
    }
  }

  if (workflows.length === 0) return;

  const uniqueWorkflows = [...new Set(workflows.map((w) => w.workflow))];

  if (uniqueWorkflows.length === 1) {
    const workflow = uniqueWorkflows[0];

    if (workflow === 'generic') {
      Log.warn(
        chalk.default.yellow(
          `NOT using Continuous Native Generation. https://docs.expo.dev/workflow/continuous-native-generation/\n`
        )
      );
    } else {
      Log.warn(
        chalk.default.yellow(
          `Using Continuous Native Generation. https://docs.expo.dev/workflow/continuous-native-generation/\n`
        )
      );
    }
  } else {
    let message = '';
    workflows.forEach(({ platform, workflow }) => {
      if (workflow === 'generic') {
        message += `The ${platform} project NOT using the Continuous Native Generation.\n`;
      } else {
        message += `The ${platform} project is using the Continuous Native Generation.\n`;
      }
    });
    message += 'https://docs.expo.dev/workflow/continuous-native-generation\n';
    Log.warn(chalk.default.yellow(message));
  }
}
