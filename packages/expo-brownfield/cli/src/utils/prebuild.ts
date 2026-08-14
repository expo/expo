import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { getConfig, getPackageJson } from 'expo/config';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';

import CLIError from './error';
import { withSpinner } from './spinner';
import type { Platform } from './types';

export const validatePrebuild = async (
  platform: Platform,
  options: { dryRun?: boolean } = {}
): Promise<void> => {
  validatePackageInstalled();

  if (!checkPrebuild(platform)) {
    console.info(`${chalk.yellow(`⚠ Prebuild for platform: ${platform} is missing`)}`);

    let shouldRunPrebuild: boolean;
    if (isInteractive()) {
      const response = await prompts({
        type: 'confirm',
        name: 'shouldRunPrebuild',
        message: 'Do you want to run the prebuild now?',
        initial: false,
      });
      shouldRunPrebuild = !!response.shouldRunPrebuild;
    } else {
      console.info(
        `Non-interactive shell detected; running \`npx expo prebuild --platform ${platform}\` automatically`
      );
      shouldRunPrebuild = true;
    }

    if (shouldRunPrebuild) {
      await withSpinner({
        operation: () => spawnAsync('npx', ['expo', 'prebuild', '--platform', platform]),
        loaderMessage: `Running 'npx expo prebuild' for platform: ${platform}...`,
        successMessage: `Prebuild for ${platform} completed\n`,
        errorMessage: `Prebuild for ${platform} failed`,
        verbose: false,
      });
    } else {
      CLIError.handle('prebuild-cancelled');
    }
  }

  if (platform === 'ios' && !options.dryRun) {
    await validateIosPodsInstalled();
  }
};

const validateIosPodsInstalled = async (): Promise<void> => {
  if (checkIosWorkspace()) {
    return;
  }

  console.info(
    `${chalk.yellow(
      '⚠ iOS workspace not found. CocoaPods has not been installed in the `ios/` directory yet.'
    )}`
  );
  const response = await prompts({
    type: 'confirm',
    name: 'shouldRunPodInstall',
    message: 'Do you want to run `pod install` now?',
    initial: true,
  });

  if (!response.shouldRunPodInstall) {
    CLIError.handle('ios-pod-install-cancelled');
    return;
  }

  await withSpinner({
    operation: () => spawnAsync('pod', ['install'], { cwd: path.join(process.cwd(), 'ios') }),
    loaderMessage: 'Running `pod install` in the `ios` directory...',
    successMessage: 'Pod install completed\n',
    errorMessage: 'Pod install failed',
    verbose: false,
  });

  if (!checkIosWorkspace()) {
    CLIError.handle('ios-workspace-not-found');
  }
};

const checkIosWorkspace = (): boolean => {
  const iosPath = path.join(process.cwd(), 'ios');
  if (!fs.existsSync(iosPath)) {
    return false;
  }
  try {
    return fs.readdirSync(iosPath).some((name) => name.endsWith('.xcworkspace'));
  } catch {
    return false;
  }
};

export const validatePackageInstalled = (): void => {
  const PACKAGE_NAME = 'expo-brownfield';
  const packageJson = getPackageJson(process.cwd());
  if (!packageJson.dependencies?.[PACKAGE_NAME] && !packageJson.devDependencies?.[PACKAGE_NAME]) {
    CLIError.handle('package-not-installed');
    return;
  }
  const { exp: config } = getConfig(process.cwd(), { skipSDKVersionRequirement: true });
  const isBrownfieldPluginConfigured = config.plugins?.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === PACKAGE_NAME : plugin === PACKAGE_NAME
  );
  if (!isBrownfieldPluginConfigured) {
    CLIError.handle('plugin-not-configured');
  }
};

const checkPrebuild = (platform: Platform): boolean => {
  const nativeDirectory = path.join(process.cwd(), platform);
  return fs.existsSync(nativeDirectory);
};

const isInteractive = (): boolean => {
  return !!process.stdin.isTTY && !!process.stdout.isTTY;
};
