import { execSync } from 'child_process';
import semver from 'semver';

import * as Log from '../../../log';
import { memoize } from '../../../utils/fn';
import { profile } from '../../../utils/profile';
import { confirmAsync } from '../../../utils/prompts';

// Based on the RN docs (Aug 2020).
export const MIN_XCODE_VERSION = 9.4;
export const APP_STORE_ID = '497799835';

const SUGGESTED_XCODE_VERSION = `${MIN_XCODE_VERSION}.0`;

/**
 * Ensure Xcode is installed an recent enough to be used with Expo.
 *
 * @return true when Xcode is installed, false when the process should end.
 */
export async function ensureXcodeInstalledAsync({
  cache,
}: { cache?: boolean } = {}): Promise<boolean> {
  const version = profile(cache === false ? getXcodeVersionInternal : getXcodeVersion)();
  if (!version) {
    // Almost certainly Xcode isn't installed.
    await promptToOpenAppStoreAsync(
      `Xcode needs to be installed (don't worry, you won't have to use it), would you like to continue to the App Store?`
    );
    return false;
  }

  if (semver.lt(version, SUGGESTED_XCODE_VERSION)) {
    // Xcode version is too old.
    await promptToOpenAppStoreAsync(
      `Xcode (${version}) needs to be updated to at least version ${MIN_XCODE_VERSION}, would you like to continue to the App Store?`
    );
    return false;
  }

  return true;
}

export const promptToOpenAppStoreAsync = async (message: string) => {
  // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
  const confirm = await confirmAsync({ initial: true, message });
  if (confirm) {
    Log.log(`Going to the App Store, re-run Expo when Xcode is finished installing.`);
    openAppStore(APP_STORE_ID);
  }
};

/** Exposed for testing, use `getXcodeVersion` */
export const getXcodeVersionInternal = (): string | null | false => {
  try {
    const last = execSync('xcodebuild -version', { stdio: 'pipe' })
      .toString()
      .match(/^Xcode (\d+\.\d+)/)?.[1];
    // Convert to a semver string
    if (last) {
      const version = `${last}.0`;

      if (!semver.valid(version)) {
        // Not sure why this would happen, if it does we should add a more confident error message.
        Log.error(`Xcode version is in an unknown format: ${version}`);
        return false;
      }

      return version;
    }
    // not sure what's going on
    Log.error(
      'Unable to check Xcode version. Command ran successfully but no version number was found.'
    );
  } catch {
    // not installed
  }
  return null;
};

// This method anywhere from 1-2s so cache the results in case we run it multiple times
// (like in run:ios or reopening on iOS for development build).
export const getXcodeVersion = memoize(getXcodeVersionInternal);

/**
 * Open a link to the App Store. Just link in mobile apps, **never** redirect without prompting first.
 *
 * @param appId
 */
function openAppStore(appId: string) {
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
