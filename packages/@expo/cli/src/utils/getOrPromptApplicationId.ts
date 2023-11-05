import { ExpoConfig, getAccountUsername, getConfig } from '@expo/config';
import chalk from 'chalk';

import { learnMore } from './link';
import { attemptModification } from './modifyConfigAsync';
import prompt, { confirmAsync } from './prompts';
import {
  assertValidBundleId,
  assertValidPackage,
  getBundleIdWarningAsync,
  getPackageNameWarningAsync,
  validateBundleId,
  validatePackage,
  validatePackageWithWarning,
} from './validateApplicationId';
import * as Log from '../log';

function getUsernameAsync(exp: ExpoConfig) {
  // TODO: Use XDL's UserManager
  // import { UserManager } from 'xdl';
  return getAccountUsername(exp);
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

  Log.log(
    chalk`\n{bold 📝  iOS Bundle Identifier} {dim ${learnMore(
      'https://expo.fyi/bundle-identifier'
    )}}\n`
  );

  return await promptForBundleIdAsync(projectRoot, exp);
}

async function promptForBundleIdAsync(projectRoot: string, exp: ExpoConfig): Promise<string> {
  // Prompt the user for the bundle ID.
  // Even if the project is using a dynamic config we can still
  // prompt a better error message, recommend a default value, and help the user
  // validate their custom bundle ID upfront.
  const { bundleIdentifier } = await prompt(
    {
      type: 'text',
      name: 'bundleIdentifier',
      initial: (await getRecommendedBundleIdAsync(exp)) ?? undefined,
      // The Apple helps people know this isn't an EAS feature.
      message: `What would you like your iOS bundle identifier to be?`,
      validate: validateBundleId,
    },
    {
      nonInteractiveHelp: NO_BUNDLE_ID_MESSAGE,
    }
  );

  // Warn the user if the bundle ID is already in use.
  const warning = await getBundleIdWarningAsync(bundleIdentifier);
  if (warning && !(await warnAndConfirmAsync(warning))) {
    // Cycle the Bundle ID prompt to try again.
    return await promptForBundleIdAsync(projectRoot, exp);
  }

  // Apply the changes to the config.
  await attemptModification(
    projectRoot,
    {
      ios: { ...(exp.ios || {}), bundleIdentifier },
    },
    { ios: { bundleIdentifier } }
  );

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
async function getRecommendedBundleIdAsync(exp: ExpoConfig): Promise<string | null> {
  // Attempt to use the android package name first since it's convenient to have them aligned.
  if (exp.android?.package && validateBundleId(exp.android?.package)) {
    return exp.android?.package;
  } else {
    const username = await getUsernameAsync(exp);
    const possibleId = `com.${username}.${exp.slug}`;
    if (username && validateBundleId(possibleId)) {
      return possibleId;
    }
  }

  return null;
}

// Recommend a package name based on the username and project slug.
async function getRecommendedPackageNameAsync(exp: ExpoConfig): Promise<string | null> {
  // Attempt to use the ios bundle id first since it's convenient to have them aligned.
  if (exp.ios?.bundleIdentifier && validatePackage(exp.ios.bundleIdentifier)) {
    return exp.ios.bundleIdentifier;
  } else {
    const username = await getUsernameAsync(exp);
    // It's common to use dashes in your node project name, strip them from the suggested package name.
    const possibleId = `com.${username}.${exp.slug}`.split('-').join('');
    if (username && validatePackage(possibleId)) {
      return possibleId;
    }
  }
  return null;
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

  Log.log(
    chalk`\n{bold 📝  Android package} {dim ${learnMore('https://expo.fyi/android-package')}}\n`
  );

  return await promptForPackageAsync(projectRoot, exp);
}

async function promptForPackageAsync(projectRoot: string, exp: ExpoConfig): Promise<string> {
  // Prompt the user for the android package.
  // Even if the project is using a dynamic config we can still
  // prompt a better error message, recommend a default value, and help the user
  // validate their custom android package upfront.
  const { packageName } = await prompt(
    {
      type: 'text',
      name: 'packageName',
      initial: (await getRecommendedPackageNameAsync(exp)) ?? undefined,
      message: `What would you like your Android package name to be?`,
      validate: validatePackageWithWarning,
    },
    {
      nonInteractiveHelp: NO_PACKAGE_MESSAGE,
    }
  );

  // Warn the user if the package name is already in use.
  const warning = await getPackageNameWarningAsync(packageName);
  if (warning && !(await warnAndConfirmAsync(warning))) {
    // Cycle the Package name prompt to try again.
    return await promptForPackageAsync(projectRoot, exp);
  }

  // Apply the changes to the config.
  await attemptModification(
    projectRoot,
    {
      android: { ...(exp.android || {}), package: packageName },
    },
    {
      android: { package: packageName },
    }
  );

  return packageName;
}
