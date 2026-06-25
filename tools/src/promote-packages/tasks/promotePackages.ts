import { styleText } from 'node:util';

import { findPackagesToPromote } from './findPackagesToPromote';
import { prepareParcels } from './prepareParcels';
import { selectPackagesToPromote } from './selectPackagesToPromote';
import logger from '../../Logger';
import * as Npm from '../../Npm';
import { promptOtp, withOtpRetry } from '../../NpmOtp';
import { Task } from '../../TasksRunner';
import { formatVersionChange } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

/**
 * Promotes local versions of selected packages to npm tag passed as an option.
 */
export const promotePackages = new Task<TaskArgs>(
  {
    name: 'promotePackages',
    dependsOn: [prepareParcels, findPackagesToPromote, selectPackagesToPromote],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void> => {
    logger.info(`\n🚀 Promoting packages to ${styleText(['yellow', 'bold'], options.tag)} tag...`);

    // Sort alphabetically, optionally reversed.
    const sorted = [...parcels].sort((a, b) => a.pkg.packageName.localeCompare(b.pkg.packageName));
    if (options.reverse) {
      sorted.reverse();
    }

    // Prompt for OTP up front if requested; sets env var read by Npm.addTagAsync/removeTagAsync.
    if (options.promptOtp) {
      process.env.NPM_OTP = await promptOtp();
    }

    for (const { pkg, state } of sorted) {
      const currentVersion = pkg.packageVersion;
      const { versionToReplace } = state;

      const action = state.isDemoting
        ? styleText('red', 'Demoting')
        : styleText('green', 'Promoting');
      logger.log('  ', styleText(['green', 'bold'], pkg.packageName));
      logger.log(
        '    ',
        action,
        styleText('yellow', options.tag),
        formatVersionChange(versionToReplace, currentVersion)
      );

      // Tag the local version of the package.
      if (!options.dry) {
        await withOtpRetry(() => Npm.addTagAsync(pkg.packageName, pkg.packageVersion, options.tag));
      }
    }

    logger.success(
      `\n✅ Successfully promoted ${styleText('cyan', parcels.length + '')} packages.`
    );
  }
);
