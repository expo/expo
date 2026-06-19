import chalk from 'chalk';
import os from 'node:os';

import { checkDependenciesAsync } from './checkDependenciesAsync';
import runPackageScriptAsync from './runPackageScriptAsync';
import { ActionOptions } from './types';
import logger from '../Logger';
import { Package } from '../Packages';

const { green } = chalk;

/**
 * Native-only packages that shouldn't go through these checks.
 */
const NATIVE_ONLY_PACKAGES = ['expo-modules-jsi'];

/**
 * Known packages that fail to test on Windows.
 * TODO: Fix breaking tests on Windows and remove packages from this list.
 */
const IGNORED_TEST_PACKAGES_ON_WINDOWS = [
  '@expo/cli',
  '@expo/config',
  '@expo/config-plugins',
  '@expo/env',
  '@expo/fingerprint',
  '@expo/image-utils',
  '@expo/metro-config',
  '@expo/package-manager',
  '@expo/prebuild-config',
  '@expo/router-server',
  'babel-preset-expo',
  'create-expo',
  'expo-brownfield',
  'expo-doctor',
  'expo-modules-autolinking',
  'install-expo-modules',
];

/**
 * Runs package checks on given package.
 */
export default async function checkPackageAsync(
  pkg: Package,
  options: ActionOptions
): Promise<boolean> {
  if (NATIVE_ONLY_PACKAGES.includes(pkg.packageName)) {
    logger.warn(`🚫 Skipping checks for ${green.bold(pkg.packageName)} (native-only package)`);
    return true;
  }
  try {
    switch (options.checkPackageType) {
      case 'package':
        logger.info(`🔍 Checking ${green.bold(pkg.packageName)} package`);
        break;
      case 'plugin':
        logger.info(`🔌 Checking ${green.bold(pkg.packageName)} plugin`);
        break;
      case 'cli':
        logger.info(`🍣 Checking ${green.bold(pkg.packageName)} cli`);
        break;
      case 'utils':
        logger.info(`🥜 Checking ${green.bold(pkg.packageName)} utils`);
        break;
    }

    if (options.test) {
      if (shouldSkipTest(pkg)) {
        logger.warn(`🚫 Skipping tests for ${green.bold(pkg.packageName)} on Windows`);
      } else {
        const args = ['--watch', 'false', '--passWithNoTests'];
        if (options.checkPackageType !== 'package') {
          args.unshift(options.checkPackageType);
        }
        if (process.env.CI) {
          // Limit to one worker on CIs
          args.push('--maxWorkers', '1');
        }
        await runPackageScriptAsync(pkg, 'test', args);

        if (pkg.hasReactServerComponents && options.checkPackageType === 'package') {
          // Test RSC if available...
          await runPackageScriptAsync(pkg, 'test:rsc', args);
        }
      }
    }
    if (options.lint) {
      const args = ['--max-warnings', '0'];
      if (options.checkPackageType !== 'package') {
        args.unshift(options.checkPackageType);
      }
      if (options.fixLint) {
        args.push('--fix');
      }
      await runPackageScriptAsync(pkg, 'lint', args);
    }
    if (options.dependencyCheck) {
      await checkDependenciesAsync(pkg, options.checkPackageType);
    }
    logger.log(`✨ ${green.bold(pkg.packageName)} checks passed`);

    if (options.checkPackageType === 'package') {
      let finalResult: boolean = true;
      // TODO(composite-tasks): The root `test` and `lint` tasks now cover every sub-folder in one
      // invocation — `test` via a composite multi-project Jest config (`createCompositeJestPreset`)
      // and `lint` via `expo-module lint` linting each sub-target's `src` by default. So the
      // per-target recursions below only need to dependency-check — not re-run tests or lint. These
      // `test: false`/`lint: false` flags are a temporary measure until check-packages models
      // composite packages directly.
      const subOptions = { ...options, test: false, lint: false };
      if (pkg.hasPlugin) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...subOptions, checkPackageType: 'plugin' }));
      }
      if (pkg.hasCli) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...subOptions, checkPackageType: 'cli' }));
      }
      if (pkg.hasUtils) {
        finalResult =
          finalResult && (await checkPackageAsync(pkg, { ...subOptions, checkPackageType: 'utils' }));
      }
      return finalResult;
    }
    return true;
  } catch {
    // runPackageScriptAsync is intentionally written to handle errors and make it safe to suppress errors in the caller
    return false;
  }
}

function shouldSkipTest(pkg: Package): boolean {
  return os.platform() === 'win32' && IGNORED_TEST_PACKAGES_ON_WINDOWS.includes(pkg.packageName);
}
