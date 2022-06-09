import assert from 'assert';
import chalk from 'chalk';
import fetch from 'node-fetch';

import { learnMore } from './link';
import { isUrlAvailableAsync } from './url';

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

  if (!(await isUrlAvailableAsync('itunes.apple.com'))) {
    // If no network, simply skip the warnings since they'll just lead to more confusion.
    return null;
  }

  const url = `http://itunes.apple.com/lookup?bundleId=${bundleId}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    if (json.resultCount > 0) {
      const firstApp = json.results[0];
      const message = formatInUseWarning(firstApp.trackName, firstApp.sellerName, bundleId);
      cachedBundleIdResults[bundleId] = message;
      return message;
    }
  } catch {
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

  if (!(await isUrlAvailableAsync('play.google.com'))) {
    // If no network, simply skip the warnings since they'll just lead to more confusion.
    return null;
  }

  const url = `https://play.google.com/store/apps/details?id=${packageName}`;
  try {
    const response = await fetch(url);
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
  } catch {
    // Error fetching play store data or the page doesn't exist.
  }
  return null;
}

function formatInUseWarning(appName: string, author: string, id: string): string {
  return `⚠️  The app ${chalk.bold(appName)} by ${chalk.italic(
    author
  )} is already using ${chalk.bold(id)}`;
}
