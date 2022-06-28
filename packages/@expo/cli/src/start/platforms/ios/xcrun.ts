import spawnAsync, { SpawnOptions } from '@expo/spawn-async';
import chalk from 'chalk';

import { CommandError } from '../../../utils/errors';

const debug = require('debug')('expo:start:platforms:ios:xcrun') as typeof console.log;

export async function xcrunAsync(args: (string | undefined)[], options?: SpawnOptions) {
  debug('Running: xcrun ' + args.join(' '));
  try {
    return await spawnAsync('xcrun', args.filter(Boolean) as string[], options);
  } catch (e) {
    throwXcrunError(e);
  }
}

function throwXcrunError(e: any): never {
  if (isLicenseOutOfDate(e.stdout) || isLicenseOutOfDate(e.stderr)) {
    throw new CommandError(
      'XCODE_LICENSE_NOT_ACCEPTED',
      'Xcode license is not accepted. Please run `sudo xcodebuild -license`.'
    );
  } else if (e.stderr?.includes('not a developer tool or in PATH')) {
    throw new CommandError(
      'SIMCTL_NOT_AVAILABLE',
      `You may need to run ${chalk.bold(
        'sudo xcode-select -s /Applications/Xcode.app'
      )} and try again.`
    );
  }
  // Attempt to craft a better error message...
  if (Array.isArray(e.output)) {
    e.message += '\n' + e.output.join('\n').trim();
  } else if (e.stderr) {
    e.message += '\n' + e.stderr;
  }
  throw e;
}

function isLicenseOutOfDate(text: string) {
  if (!text) {
    return false;
  }

  const lower = text.toLowerCase();
  return lower.includes('xcode') && lower.includes('license');
}
