import assert from 'assert';
import chalk from 'chalk';

import { env } from './env';
import { memoize } from './fn';
import { learnMore } from './link';
import { isUrlAvailableAsync } from './url';
import { fetchAsync } from '../api/rest/client';
import { Log } from '../log';

const debug = require('debug')('expo:utils:validateApplicationId') as typeof console.log;

const IOS_BUNDLE_ID_REGEX = /^[a-zA-Z0-9-.]+$/;
const ANDROID_PACKAGE_REGEX = /^(?!.*\bnative\b)[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

/** Validate an iOS bundle identifier. */
export function validateBundleId(value: string): boolean {
  return IOS_BUNDLE_ID_REGEX.test(value);
}

/** Validate an Android package name. */
export function validatePackage(value: string): boolean {
  return validatePackageWithWarning(value) === true;
}

/** Validate an Android package name and return the reason if invalid. */
export function validatePackageWithWarning(value: string): true | string {
  const parts = value.split('.');
  for (const segment of parts) {
    if (RESERVED_ANDROID_PACKAGE_NAME_SEGMENTS.includes(segment)) {
      return `"${segment}" is a reserved Java keyword.`;
    }
  }
  if (parts.length < 2) {
    return `Package name must contain more than one segment, separated by ".", e.g. com.${value}`;
  }
  if (!ANDROID_PACKAGE_REGEX.test(value)) {
    return 'Invalid characters in Android package name. Only alphanumeric characters, "." and "_" are allowed, and each "." must be followed by a letter or number.';
  }

  return true;
}

// https://en.wikipedia.org/wiki/List_of_Java_keywords
// Running the following in the console and pruning the "Reserved Identifiers" section:
// [...document.querySelectorAll('dl > dt > code')].map(node => node.innerText)
const RESERVED_ANDROID_PACKAGE_NAME_SEGMENTS = [
  // List of Java keywords
  '_',
  'abstract',
  'assert',
  'boolean',
  'break',
  'byte',
  'case',
  'catch',
  'char',
  'class',
  'const',
  'continue',
  'default',
  'do',
  'double',
  'else',
  'enum',
  'extends',
  'final',
  'finally',
  'float',
  'for',
  'goto',
  'if',
  'implements',
  'import',
  'instanceof',
  'int',
  'interface',
  'long',
  'native',
  'new',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'short',
  'static',
  'super',
  'switch',
  'synchronized',
  'this',
  'throw',
  'throws',
  'transient',
  'try',
  'void',
  'volatile',
  'while',
  // Reserved words for literal values
  'true',
  'false',
  'null',
  // Unused
  'const',
  'goto',
  'strictfp',
];

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
    `Invalid format of Android package name. Only alphanumeric characters, '.' and '_' are allowed, and each '.' must be followed by a letter. The Java keyword 'native' is not allowed.`
  );
}

/** @private */
export async function getBundleIdWarningInternalAsync(bundleId: string): Promise<string | null> {
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
      return formatInUseWarning(firstApp.trackName, firstApp.sellerName, bundleId);
    }
  } catch (error: any) {
    debug(`Error checking bundle ID ${bundleId}: ${error.message}`);
    // Error fetching itunes data.
  }
  return null;
}

/** Returns a warning message if an iOS bundle identifier is potentially already in use. */
export const getBundleIdWarningAsync = memoize(getBundleIdWarningInternalAsync);

/** @private */
export async function getPackageNameWarningInternalAsync(
  packageName: string
): Promise<string | null> {
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
      return `⚠️  The package ${chalk.bold(packageName)} is already in use. ${chalk.dim(
        learnMore(url)
      )}`;
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

/** Returns a warning message if an Android package name is potentially already in use. */
export const getPackageNameWarningAsync = memoize(getPackageNameWarningInternalAsync);
