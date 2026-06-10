import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import type { SemVer } from 'semver';
import semverCoerce from 'semver/functions/coerce';
import semverLt from 'semver/functions/lt';

import { Log } from '../../../log';
import { AbortCommandError } from '../../../utils/errors';
import { openBrowserAsync } from '../../../utils/open';
import { confirmAsync } from '../../../utils/prompts';
import { Prerequisite } from '../Prerequisite';

const debug = require('debug')('expo:doctor:apple:xcode-version') as typeof console.log;

// Based on the Apple announcement (last updated: June 2026). https://developer.apple.com/news/upcoming-requirements/?id=02032026a
const XCODE_MIN_VERSION = '26.0';
const XCODE_APP_STORE_ID = '497799835';

export class XcodePrerequisite extends Prerequisite<{ version: SemVer; path: string }> {
  static instance = new XcodePrerequisite();

  async assertImplementation() {
    const xcodeVersion = await getVersionFromXcodeBuild();
    const xcodePath = await getXcodeSelectPath();

    debug('Xcode version: %s', xcodeVersion?.version);
    debug('Xcode select path: %s', xcodePath);

    if (!xcodePath && (await hasXcodeInstalled())) {
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
    }

    if (!xcodeVersion || !xcodePath) {
      await promptOpenXcodeAppStore(
        `Xcode must be fully installed before you can continue. If this message is still occurring after installing Xcode, you may need to finish the installation of the developer tools by running: \`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer\`. Continue to the App Store?`
      );
      throw new AbortCommandError();
    }

    if (semverLt(xcodeVersion, `${XCODE_MIN_VERSION}.0`)) {
      await promptOpenXcodeAppStore(
        `Xcode (${xcodeVersion.major}.${xcodeVersion.minor}) needs to be updated to at least version ${XCODE_MIN_VERSION}. Continue to the App Store?`
      );
      throw new AbortCommandError();
    }

    return { version: xcodeVersion, path: xcodePath };
  }
}

async function getVersionFromXcodeBuild(): Promise<SemVer | null> {
  try {
    const result = await spawnAsync('xcodebuild', ['-version']);
    const match = result.stdout.trim().match(/Xcode (\d+\.\d+(?:\.\d+)?)/);

    if (match?.[1]) {
      return semverCoerce(match[1]);
    }

    return null;
  } catch {
    return null;
  }
}

async function hasXcodeInstalled() {
  try {
    await spawnAsync('ls', ['/Applications/Xcode.app/Contents/Developer']);
    return true;
  } catch (error) {
    return false;
  }
}

async function getXcodeSelectPath() {
  try {
    const result = await spawnAsync('xcode-select', ['--print-path']);
    return result.stdout.trim();
  } catch {
    return null;
  }
}

async function promptOpenXcodeAppStore(message: string) {
  // This prompt serves no purpose accept informing the user what to do next, we could just open the App Store but it could be confusing if they don't know what's going on.
  const confirm = await confirmAsync({ initial: true, message });
  const browserLink = `https://apps.apple.com/us/app/id${XCODE_APP_STORE_ID}`;

  if (confirm) {
    Log.log(`Going to the App Store, re-run Expo CLI when Xcode has finished installing.`);

    if (process.platform === 'darwin') {
      await spawnAsync('open', [`macappstore://itunes.apple.com/app/id${XCODE_APP_STORE_ID}`], {
        stdio: 'ignore',
      }).catch(() => {
        openBrowserAsync(browserLink);
      });
    } else {
      await openBrowserAsync(browserLink);
    }
  }
}
