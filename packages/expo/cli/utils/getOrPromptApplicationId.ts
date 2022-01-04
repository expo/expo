import { getConfig } from '@expo/config';
import chalk from 'chalk';
import { UserManager } from 'xdl';

import * as Log from '../log';
import { CommandError } from './errors';
import { attemptModification } from './modifyConfigAsync';
import prompt, { confirmAsync } from './prompts';
import { learnMore } from './TerminalLink';
import {
  getBundleIdWarningAsync,
  getPackageNameWarningAsync,
  validateBundleId,
  validatePackage,
} from './validateApplicationId';

const noBundleIdMessage = `Your project must have a \`bundleIdentifier\` set in the Expo config (app.json or app.config.js).\nSee https://expo.fyi/bundle-identifier`;
const noPackageMessage = `Your project must have a \`package\` set in the Expo config (app.json or app.config.js).\nSee https://expo.fyi/android-package`;

export async function getOrPromptForBundleIdentifier(projectRoot: string): Promise<string> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const currentBundleId = exp.ios?.bundleIdentifier;
  if (currentBundleId) {
    if (validateBundleId(currentBundleId)) {
      return currentBundleId;
    }
    throw new CommandError(
      `The ios.bundleIdentifier defined in your Expo config is not formatted properly. Only alphanumeric characters, '.', '-', and '_' are allowed, and each '.' must be followed by a letter.`
    );
  }

  // Recommend a bundle ID based on the username and project slug.
  let recommendedBundleId: string | undefined;
  // Attempt to use the android package name first since it's convenient to have them aligned.
  if (exp.android?.package && validateBundleId(exp.android?.package)) {
    recommendedBundleId = exp.android?.package;
  } else {
    const username = exp.owner ?? (await UserManager.getCurrentUsernameAsync());
    const possibleId = `com.${username}.${exp.slug}`;
    if (username && validateBundleId(possibleId)) {
      recommendedBundleId = possibleId;
    }
  }

  Log.addNewLineIfNone();
  Log.log(
    `${chalk.bold(`📝  iOS Bundle Identifier`)} ${chalk.dim(
      learnMore('https://expo.fyi/bundle-identifier')
    )}`
  );
  Log.newLine();
  // Prompt the user for the bundle ID.
  // Even if the project is using a dynamic config we can still
  // prompt a better error message, recommend a default value, and help the user
  // validate their custom bundle ID upfront.
  const { bundleIdentifier } = await prompt(
    {
      type: 'text',
      name: 'bundleIdentifier',
      initial: recommendedBundleId,
      // The Apple helps people know this isn't an EAS feature.
      message: `What would you like your iOS bundle identifier to be?`,
      validate: validateBundleId,
    },
    {
      nonInteractiveHelp: noBundleIdMessage,
    }
  );

  // Warn the user if the bundle ID is already in use.
  const warning = await getBundleIdWarningAsync(bundleIdentifier);
  if (warning) {
    Log.newLine();
    Log.nestedWarn(warning);
    Log.newLine();
    if (
      !(await confirmAsync({
        message: `Continue?`,
        initial: true,
      }))
    ) {
      Log.newLine();
      return getOrPromptForBundleIdentifier(projectRoot);
    }
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

export async function getOrPromptForPackage(projectRoot: string): Promise<string> {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });

  const currentPackage = exp.android?.package;
  if (currentPackage) {
    if (validatePackage(currentPackage)) {
      return currentPackage;
    }
    throw new CommandError(
      `Invalid format of Android package name. Only alphanumeric characters, '.' and '_' are allowed, and each '.' must be followed by a letter.`
    );
  }

  // Recommend a package name based on the username and project slug.
  let recommendedPackage: string | undefined;
  // Attempt to use the ios bundle id first since it's convenient to have them aligned.
  if (exp.ios?.bundleIdentifier && validatePackage(exp.ios.bundleIdentifier)) {
    recommendedPackage = exp.ios.bundleIdentifier;
  } else {
    const username = exp.owner ?? (await UserManager.getCurrentUsernameAsync());
    // It's common to use dashes in your node project name, strip them from the suggested package name.
    const possibleId = `com.${username}.${exp.slug}`.split('-').join('');
    if (username && validatePackage(possibleId)) {
      recommendedPackage = possibleId;
    }
  }

  Log.addNewLineIfNone();
  Log.log(
    `${chalk.bold(`📝  Android package`)} ${chalk.dim(
      learnMore('https://expo.fyi/android-package')
    )}`
  );
  Log.newLine();

  // Prompt the user for the android package.
  // Even if the project is using a dynamic config we can still
  // prompt a better error message, recommend a default value, and help the user
  // validate their custom android package upfront.
  const { packageName } = await prompt(
    {
      type: 'text',
      name: 'packageName',
      initial: recommendedPackage,
      message: `What would you like your Android package name to be?`,
      validate: validatePackage,
    },
    {
      nonInteractiveHelp: noPackageMessage,
    }
  );

  // Warn the user if the package name is already in use.
  const warning = await getPackageNameWarningAsync(packageName);
  if (warning) {
    Log.newLine();
    Log.nestedWarn(warning);
    Log.newLine();
    if (
      !(await confirmAsync({
        message: `Continue?`,
        initial: true,
      }))
    ) {
      Log.newLine();
      return getOrPromptForPackage(projectRoot);
    }
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
