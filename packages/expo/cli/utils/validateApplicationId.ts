import got from 'got';

import * as Log from '../log';
import { learnMore } from './TerminalLink';
import { isUrlAvailableAsync } from './url';

export function validateBundleId(value: string): boolean {
  return /^[a-zA-Z0-9-.]+$/.test(value);
}

export function validatePackage(value: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(value);
}

const cachedBundleIdResults: Record<string, string> = {};
const cachedPackageNameResults: Record<string, string> = {};

/**
 * A quality of life method that provides a warning when the bundle ID is already in use.
 *
 * @param bundleId
 */
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
    const response = await got(url);
    const json = JSON.parse(response.body?.trim());
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
    const response = await got(url);
    // If the page exists, then warn the user.
    if (response.statusCode === 200) {
      // There is no JSON API for the Play Store so we can't concisely
      // locate the app name and developer to match the iOS warning.
      const message = `⚠️  The package ${Log.chalk.bold(
        packageName
      )} is already in use. ${Log.chalk.dim(learnMore(url))}`;
      cachedPackageNameResults[packageName] = message;
      return message;
    }
  } catch {
    // Error fetching play store data or the page doesn't exist.
  }
  return null;
}

function formatInUseWarning(appName: string, author: string, id: string): string {
  return `⚠️  The app ${Log.chalk.bold(appName)} by ${Log.chalk.italic(
    author
  )} is already using ${Log.chalk.bold(id)}`;
}
