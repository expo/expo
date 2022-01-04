import { ExpoConfig } from '@expo/config';
import { ModPlatform } from '@expo/config-plugins';
import temporary from 'tempy';

import * as Log from '../log';
import { logNewSection } from '../../utils/ora';
import * as CreateApp from '../utils/CreateApp';
import configureProjectAsync from './configureProjectAsync';
import { createNativeProjectsFromTemplateAsync } from './createNativeProjectsFromTemplateAsync';
import { ensureConfigAsync } from './ensureConfigAsync';
import { installNodeDependenciesAsync } from './installNodeDependenciesAsync';
import { assertPlatforms, ensureValidPlatforms } from './platformOptions';
import { resolveTemplateOption } from './resolveTemplate';

export type EjectAsyncOptions = {
  verbose?: boolean;
  force?: boolean;
  template?: string;
  install?: boolean;
  packageManager?: 'npm' | 'yarn';
  platforms: ModPlatform[];
  skipDependencyUpdate?: string[];
};

export type PrebuildResults = {
  exp: ExpoConfig;
  hasNewProjectFiles: boolean;
  platforms: ModPlatform[];
  podInstall: boolean;
  nodeInstall: boolean;
  packageManager: string;
};

/**
 * Entry point into the prebuild process, delegates to other helpers to perform various steps.
 *
 * 1. Create native projects (ios, android)
 * 2. Install node modules
 * 3. Apply config to native projects
 * 4. Install CocoaPods
 */
export async function prebuildAsync(
  projectRoot: string,
  { platforms, ...options }: EjectAsyncOptions
): Promise<PrebuildResults> {
  platforms = ensureValidPlatforms(platforms);
  assertPlatforms(platforms);

  const { exp, pkg } = await ensureConfigAsync({ projectRoot, platforms });
  const tempDir = temporary.directory();

  const { hasNewProjectFiles, needsPodInstall, hasNewDependencies } =
    await createNativeProjectsFromTemplateAsync({
      projectRoot,
      exp,
      pkg,
      template: options.template != null ? resolveTemplateOption(options.template) : undefined,
      tempDir,
      platforms,
      skipDependencyUpdate: options.skipDependencyUpdate,
    });

  // Install node modules
  const shouldInstall = options?.install !== false;

  const packageManager = CreateApp.resolvePackageManager({
    install: shouldInstall,
    npm: options?.packageManager === 'npm',
    yarn: options?.packageManager === 'yarn',
  });

  if (shouldInstall) {
    await installNodeDependenciesAsync(projectRoot, packageManager, {
      // We delete the dependencies when new ones are added because native packages are more fragile.
      // npm doesn't work well so we always run the cleaning step when npm is used in favor of yarn.
      clean: hasNewDependencies || packageManager === 'npm',
    });
  }

  // Apply Expo config to native projects
  const configSyncingStep = logNewSection('Config syncing');
  try {
    await configureProjectAsync({
      projectRoot,
      platforms,
    });
    configSyncingStep.succeed('Config synced');
  } catch (error) {
    configSyncingStep.fail('Config sync failed');
    throw error;
  }

  // Install CocoaPods
  let podsInstalled: boolean = false;
  // err towards running pod install less because it's slow and users can easily run npx pod-install afterwards.
  if (platforms.includes('ios') && shouldInstall && needsPodInstall) {
    podsInstalled = await CreateApp.installCocoaPodsAsync(projectRoot);
  } else {
    Log.debug('Skipped pod install');
  }

  return {
    packageManager,
    nodeInstall: options.install === false,
    podInstall: !podsInstalled,
    platforms,
    hasNewProjectFiles,
    exp,
  };
}
