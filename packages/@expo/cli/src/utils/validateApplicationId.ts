import assert from 'assert';
import chalk from 'chalk';

import { fetchAsync } from '../api/rest/client';
import { Log } from '../log';
import { env } from './env';
import { learnMore } from './link';
import { isUrlAvailableAsync } from './url';

const debug = require('debug')('expo:utils:validateApplicationId') as typeof console.log;

const IOS_BUNDLE_ID_REGEX = /^[a-zA-Z0-9-.]+$/;
const ANDROID_PACKAGE_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

/** Validate an iOS bundle identifier. */
export function validateBundleId(value: string): boolean {
  return IOS_BUNDLE_ID_REGEX.test(value);
}

/** Validate an Android package name. */
export function validatePackage(value: string): boolean {
  return ANDROID_PACKAGE_REGEX.test(value);
}

export function assertValidBundleId(value: string) {
  assert.match(
    value,
    IOS_BUNDLE_ID_REGEX,
    `The ios.bundleIdentifier defined in your Expo config is not formatted properly. Only alphanumeric characters, '.', '-', and '_' are allowed, and each '.' must be followed by a letter.`
  );
}

export function assertValidPackage(value: string) {
  assert.match(
    value,
    ANDROID_PACKAGE_REGEX,
    `Invalid format of Android package name. Only alphanumeric characters, '.' and '_' are allowed, and each '.' must be followed by a letter.`
  );
}

const cachedBundleIdResults: Record<string, string> = {};
const cachedPackageNameResults: Record<string, string> = {};

/** Returns a warning message if an iOS bundle identifier is potentially already in use. */
export async function getBundleIdWarningAsync(bundleId: string): Promise<string | null> {
  // Prevent fetching for the same ID multiple times.
  if (cachedBundleIdResults[bundleId]) {
    return cachedBundleIdResults[bundleId];
  }

  if (env.EXPO_OFFLINE) {
    Log.warn('Skipping Apple bundle identifier reservation validation in offline-mode.');
    return null;
  }

  if (!(await isUrlAvailableAsync('itunes.apple.com'))) {
    debug(
      `Couldn't connect to iTunes Store to check bundle ID ${bundleId}. itunes.apple.com may be down.`
    );
    // If no network, simply skip the warnings since they'll just lead to more confusion.
    return null;
  }

  const url = `http://itunes.apple.com/lookup?bundleId=${bundleId}`;
  try {
    debug(`Checking iOS bundle ID '${bundleId}' at: ${url}`);
    const response = await fetchAsync(url);
    const json = await response.json();
    if (json.resultCount > 0) {
      const firstApp = json.results[0];
      const message = formatInUseWarning(firstApp.trackName, firstApp.sellerName, bundleId);
      cachedBundleIdResults[bundleId] = message;
      return message;
    }
  } catch (error: any) {
    debug(`Error checking bundle ID ${bundleId}: ${error.message}`);
    // Error fetching itunes data.
  }
  return null;
}

/** Returns a warning message if an Android package name is potentially already in use. */
export async function getPackageNameWarningAsync(packageName: string): Promise<string | null> {
  // Prevent fetching for the same ID multiple times.
  if (cachedPackageNameResults[packageName]) {
    return cachedPackageNameResults[packageName];
  }

  if (env.EXPO_OFFLINE) {
    Log.warn('Skipping Android package name reservation validation in offline-mode.');
    return null;
  }

  if (!(await isUrlAvailableAsync('play.google.com'))) {
    debug(
      `Couldn't connect to Play Store to check package name ${packageName}. play.google.com may be down.`
    );
    // If no network, simply skip the warnings since they'll just lead to more confusion.
    return null;
  }

  const url = `https://play.google.com/store/apps/details?id=${packageName}`;
  try {
    debug(`Checking Android package name '${packageName}' at: ${url}`);
    const response = await fetchAsync(url);
    // If the page exists, then warn the user.
    if (response.status === 200) {
      // There is no JSON API for the Play Store so we can't concisely
      // locate the app name and developer to match the iOS warning.
      const message = `⚠️  The package ${chalk.bold(packageName)} is already in use. ${chalk.dim(
        learnMore(url)
      )}`;
      cachedPackageNameResults[packageName] = message;
      return message;
    }
  } catch (error: any) {
    // Error fetching play store data or the page doesn't exist.
    debug(`Error checking package name ${packageName}: ${error.message}`);
  }
  return null;
}

function formatInUseWarning(appName: string, author: string, id: string): string {
  return `⚠️  The app ${chalk.bold(appName)} by ${chalk.italic(
    author
  )} is already using ${chalk.bold(id)}`;
}
