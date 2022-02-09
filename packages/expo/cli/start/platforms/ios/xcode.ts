import { execSync } from 'child_process';

import * as Log from '../../../log';

// Based on the RN docs (Aug 2020).
export const minimumVersion = 9.4;
export const appStoreId = '497799835';

let _xcodeVersion: string | null | false = false;

export function getXcodeVersion(): string | null | false {
  // This method anywhere from 1-2s so cache the results in case we run it multiple times
  // (like in run:ios or reopening on iOS for development build).
  if (_xcodeVersion !== false) {
    return _xcodeVersion;
  }
  try {
    const last = execSync('xcodebuild -version', { stdio: 'pipe' })
      .toString()
      .match(/^Xcode (\d+\.\d+)/)?.[1];
    // Convert to a semver string
    if (last) {
      _xcodeVersion = `${last}.0`;
      return _xcodeVersion;
    }
    // not sure what's going on
    Log.error(
      'Unable to check Xcode version. Command ran successfully but no version number was found.'
    );
  } catch {
    // not installed
  }
  _xcodeVersion = null;
  return _xcodeVersion;
}

/**
 * Open a link to the App Store. Just link in mobile apps, **never** redirect without prompting first.
 *
 * @param appId
 */
export function openAppStore(appId: string) {
  const link = getAppStoreLink(appId);
  execSync(`open ${link}`, { stdio: 'ignore' });
}

function getAppStoreLink(appId: string): string {
  if (process.platform === 'darwin') {
    // TODO: Is there ever a case where the macappstore isn't available on mac?
    return `macappstore://itunes.apple.com/app/id${appId}`;
  }
  return `https://apps.apple.com/us/app/id${appId}`;
}
