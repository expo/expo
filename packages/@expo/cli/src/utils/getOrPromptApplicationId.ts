import { ExpoConfig, getAccountUsername, getConfig } from '@expo/config';
import chalk from 'chalk';

import { memoize } from './fn';
import { learnMore } from './link';
import { attemptModification } from './modifyConfigAsync';
import prompt, { confirmAsync } from './prompts';
import {
  assertValidBundleId,
  assertValidPackage,
  getBundleIdWarningAsync,
  getPackageNameWarningAsync,
  getSanitizedBundleIdentifier,
  getSanitizedPackage,
  validateBundleId,
  validatePackage,
  validatePackageWithWarning,
} from './validateApplicationId';
import * as Log from '../log';

const debug = require('debug')('expo:app-id') as typeof console.log;

function getExpoUsername(exp: ExpoConfig) {
  // Account for if the environment variable was an empty string.
  return getAccountUsername(exp) || 'anonymous';
}

const NO_BUNDLE_ID_MESSAGE = `Project must have a \`ios.bundleIdentifier\` set in the Expo config (app.json or app.config.js).`;

const NO_PACKAGE_MESSAGE = `Project must have a \`android.package\` set in the Expo config (app.json or app.config.js).`;

/**
 * Get the bundle identifier from the Expo config or prompt the user to choose a new bundle identifier.
 * Prompted value will be validated against the App Store and a local regex.
 * If the project Expo config is a static JSON file, the bundle identifier will be updated in the config automatically.
 */
export async function getOrPromptForBundleIdentifier(
  projectRoot: string,
  exp: ExpoConfig = getConfig(projectRoot).exp
): Promise<string> {
  const current = exp.ios?.bundleIdentifier;
  if (current) {
    assertValidBundleId(current);
    return current;
  }

  return promptForBundleIdWithInitialAsync(projectRoot, exp, getRecommendedBundleId(exp));
}

const memoLog = memoize(Log.log);

async function promptForBundleIdWithInitialAsync(
  projectRoot: string,
  exp: ExpoConfig,
  bundleIdentifier?: string
): Promise<string> {
  if (!bundleIdentifier) {
    memoLog(
      chalk`\n{bold 📝  iOS Bundle Identifier} {dim ${learnMore(
        'https://expo.fyi/bundle-identifier'
      )}}\n`
    );

    // Prompt the user for the bundle ID.
    // Even if the project is using a dynamic config we can still
    // prompt a better error message, recommend a default value, and help the user
    // validate their custom bundle ID upfront.
    const { input } = await prompt(
      {
        type: 'text',
        name: 'input',
        // The Apple helps people know this isn't an EAS feature.
        message: `What would you like your iOS bundle identifier to be?`,
        validate: validateBundleId,
      },
      {
        nonInteractiveHelp: NO_BUNDLE_ID_MESSAGE,
      }
    );
    bundleIdentifier = input as string;
  }

  // Warn the user if the bundle ID is already in use.
  const warning = await getBundleIdWarningAsync(bundleIdentifier);

  if (warning && !(await warnAndConfirmAsync(warning))) {
    // Cycle the Bundle ID prompt to try again.
    return await promptForBundleIdWithInitialAsync(projectRoot, exp);
  }

  // Apply the changes to the config.
  if (
    await attemptModification(
      projectRoot,
      {
        ios: { ...(exp.ios || {}), bundleIdentifier },
      },
      { ios: { bundleIdentifier } }
    )
  ) {
    Log.log(chalk.gray`\u203A Apple bundle identifier: ${bundleIdentifier}`);
  }

  return bundleIdentifier;
}

async function warnAndConfirmAsync(warning: string): Promise<boolean> {
  Log.log();
  Log.warn(warning);
  Log.log();
  if (
    !(await confirmAsync({
      message: `Continue?`,
      initial: true,
    }))
  ) {
    return false;
  }
  return true;
}

// Recommend a bundle identifier based on the username and project slug.
function getRecommendedBundleId(exp: ExpoConfig): string | undefined {
  const possibleIdFromAndroid = exp.android?.package
    ? getSanitizedBundleIdentifier(exp.android.package)
    : undefined;
  // Attempt to use the android package name first since it's convenient to have them aligned.
  if (possibleIdFromAndroid && validateBundleId(possibleIdFromAndroid)) {
    return possibleIdFromAndroid;
  } else {
    const username = getExpoUsername(exp);
    const possibleId = getSanitizedBundleIdentifier(`com.${username}.${exp.slug}`);
    if (validateBundleId(possibleId)) {
      return possibleId;
    }
  }

  return undefined;
}

// Recommend a package name based on the username and project slug.
function getRecommendedPackageName(exp: ExpoConfig): string | undefined {
  const possibleIdFromApple = exp.ios?.bundleIdentifier
    ? getSanitizedPackage(exp.ios.bundleIdentifier)
    : undefined;

  // Attempt to use the ios bundle id first since it's convenient to have them aligned.
  if (possibleIdFromApple && validatePackage(possibleIdFromApple)) {
    return possibleIdFromApple;
  } else {
    const username = getExpoUsername(exp);
    const possibleId = getSanitizedPackage(`com.${username}.${exp.slug}`);
    if (validatePackage(possibleId)) {
      return possibleId;
    } else {
      debug(
        `Recommended package name is invalid: "${possibleId}" (username: ${username}, slug: ${exp.slug})`
      );
    }
  }
  return undefined;
}

/**
 * Get the package name from the Expo config or prompt the user to choose a new package name.
 * Prompted value will be validated against the Play Store and a local regex.
 * If the project Expo config is a static JSON file, the package name will be updated in the config automatically.
 */
export async function getOrPromptForPackage(
  projectRoot: string,
  exp: ExpoConfig = getConfig(projectRoot).exp
): Promise<string> {
  const current = exp.android?.package;
  if (current) {
    assertValidPackage(current);
    return current;
  }

  return await promptForPackageAsync(projectRoot, exp);
}

function promptForPackageAsync(projectRoot: string, exp: ExpoConfig): Promise<string> {
  return promptForPackageWithInitialAsync(projectRoot, exp, getRecommendedPackageName(exp));
}

async function promptForPackageWithInitialAsync(
  projectRoot: string,
  exp: ExpoConfig,
  packageName?: string
): Promise<string> {
  if (!packageName) {
    memoLog(
      chalk`\n{bold 📝  Android package} {dim ${learnMore('https://expo.fyi/android-package')}}\n`
    );

    // Prompt the user for the android package.
    // Even if the project is using a dynamic config we can still
    // prompt a better error message, recommend a default value, and help the user
    // validate their custom android package upfront.
    const { input } = await prompt(
      {
        type: 'text',
        name: 'input',
        message: `What would you like your Android package name to be?`,
        validate: validatePackageWithWarning,
      },
      {
        nonInteractiveHelp: NO_PACKAGE_MESSAGE,
      }
    );
    packageName = input as string;
  }

  // Warn the user if the package name is already in use.
  const warning = await getPackageNameWarningAsync(packageName);
  if (warning && !(await warnAndConfirmAsync(warning))) {
    // Cycle the Package name prompt to try again.
    return promptForPackageWithInitialAsync(projectRoot, exp);
  }

  // Apply the changes to the config.
  if (
    await attemptModification(
      projectRoot,
      {
        android: { ...(exp.android || {}), package: packageName },
      },
      {
        android: { package: packageName },
      }
    )
  ) {
    Log.log(chalk.gray`\u203A Android package name: ${packageName}`);
  }

  return packageName;
}
