import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import { execSync } from 'child_process';
import semver from 'semver';

import * as Log from '../../../log';
import { AbortCommandError } from '../../../utils/errors';
import { profile } from '../../../utils/profile';
import { confirmAsync } from '../../../utils/prompts';
import { Prerequisite } from '../Prerequisite';

const debug = require('debug')('expo:doctor:apple:xcode') as typeof console.log;

// Based on the Apple announcement (last updated: Aug 2023).
// https://developer.apple.com/news/upcoming-requirements/?id=04252023a
const MIN_XCODE_VERSION = '14.1';
const APP_STORE_ID = '497799835';

const SUGGESTED_XCODE_VERSION = `${MIN_XCODE_VERSION}.0`;

const promptToOpenAppStoreAsync = async (message: string) => {
  // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
  const confirm = await confirmAsync({ initial: true, message });
  if (confirm) {
    Log.log(`Going to the App Store, re-run Expo CLI when Xcode has finished installing.`);
    openAppStore(APP_STORE_ID);
  }
};

let _xcodeVersionPromise: Promise<{ value: string | null | false; error?: string }> | null = null;

export const getXcodeVersionAsync = async ({
  silent,
  force,
}: { silent?: boolean; force?: boolean } = {}): Promise<string | null | false> => {
  const logError = silent ? debug : Log.warn;
  const getVersion = async (): Promise<{ value: string | null | false; error?: string }> => {
    try {
      const { stdout } = await spawnAsync('xcodebuild', ['-version']);
      const last = stdout.match(/^Xcode (\d+\.\d+)/)?.[1];
      // Convert to a semver string
      if (last) {
        const version = `${last}.0`;

        if (!semver.valid(version)) {
          // Not sure why this would happen, if it does we should add a more confident error message.
          return { error: `Xcode version is in an unknown format: ${version}`, value: false };
        }
        return { value: version };
      }

      // not sure what's going on
      return {
        error:
          'Unable to check Xcode version. Command ran successfully but no version number was found.',
        value: null,
      };
    } catch {
      // not installed
    }
    return { value: null };
  };

  if (force) {
    _xcodeVersionPromise = null;
  }

  _xcodeVersionPromise = _xcodeVersionPromise ?? getVersion();

  const result = await _xcodeVersionPromise;

  if (result.error) {
    logError(result.error);
  }

  return result.value;
};

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

function spawnForString(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: 'pipe' }).toString().trim();
  } catch {}
  return null;
}

/** @returns a string like `/Applications/Xcode.app/Contents/Developer` when Xcode has a correctly selected path. */
function getXcodeSelectPathAsync() {
  return spawnForString('/usr/bin/xcode-select --print-path');
}
function getXcodeInstalled() {
  return spawnForString('ls /Applications/Xcode.app/Contents/Developer');
}

export class XcodePrerequisite extends Prerequisite {
  static instance = new XcodePrerequisite();

  /**
   * Ensure Xcode is installed and recent enough to be used with Expo.
   */
  async assertImplementation(): Promise<void> {
    const version = await profile(getXcodeVersionAsync)({ force: process.env.NODE_ENV === 'test' });
    debug(`Xcode version: ${version}`);
    if (!version) {
      // A couple different issues could have occurred, let's check them after we're past the point of no return
      // since we no longer need to be fast about validation.

      // Ensure Xcode.app can be found before we prompt to sudo select it.
      if (getXcodeInstalled()) {
        const selectPath = profile(getXcodeSelectPathAsync)();
        debug(`Xcode select path: ${selectPath}`);
        if (!selectPath) {
          Log.error(
            [
              '',
              chalk.bold('Xcode has not been fully setup for Apple development yet.'),
              'Download at: https://developer.apple.com/xcode/',
              'or in the App Store.',
              '',
              'After downloading Xcode, run the following two commands in your terminal:',
              chalk.cyan('  sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer'),
              chalk.cyan('  sudo xcodebuild -runFirstLaunch'),
              '',
              'Then you can re-run Expo CLI. Alternatively, you can build apps in the cloud with EAS CLI, or preview using the Expo Go app on a physical device.',
              '',
            ].join('\n')
          );
          throw new AbortCommandError();
        } else {
          debug(`Unexpected Xcode setup (version: ${version}, select: ${selectPath})`);
        }
      }

      // Almost certainly Xcode isn't installed.
      await promptToOpenAppStoreAsync(
        `Xcode must be fully installed before you can continue. Continue to the App Store?`
      );
      throw new AbortCommandError();
    }

    if (semver.lt(version, SUGGESTED_XCODE_VERSION)) {
      // Xcode version is too old.
      await promptToOpenAppStoreAsync(
        `Xcode (${version}) needs to be updated to at least version ${MIN_XCODE_VERSION}. Continue to the App Store?`
      );
      throw new AbortCommandError();
    }
  }
}
