import chalk from 'chalk';

import { Parcel } from './types';
import * as Changelogs from '../Changelogs';
import { GitDirectory } from '../Git';
import logger from '../Logger';
import { Package } from '../Packages';

const { cyan, green, magenta, red, gray } = chalk;

/**
 * Wraps `Package` object into a parcels - convenient wrapper providing more package-related helpers.
 */
export async function createParcelAsync(pkg: Package): Promise<Parcel> {
  return {
    pkg,
    pkgView: await pkg.getPackageViewAsync(),
    changelog: Changelogs.loadFrom(pkg.changelogPath),
    gitDir: new GitDirectory(pkg.path),
    state: {},
  };
}

/**
 * Formats version change from version A to version B.
 */
export function formatVersionChange(
  fromVersion: string | null | undefined,
  toVersion: string
): string {
  const from = fromVersion ? cyan.bold(fromVersion) : gray.bold('none');
  const to = cyan.bold(toVersion);
  return `from ${from} to ${to}`;
}

/**
 * Prints a lists of packages to promote or demote.
 */
export function printPackagesToPromote(parcels: Parcel[]): void {
  const toDemote = parcels.filter(({ state }) => state.isDemoting);
  const toPromote = parcels.filter(({ state }) => !state.isDemoting);

  printPackagesToPromoteInternal(toDemote, red.bold('demoted'));
  printPackagesToPromoteInternal(toPromote, green.bold('promoted'));
}

function printPackagesToPromoteInternal(parcels: Parcel[], action: string): void {
  if (parcels.length > 0) {
    logger.log('  ', magenta(`Following packages would be ${action}:`));

    for (const { pkg, state } of parcels) {
      logger.log(
        '    ',
        green(pkg.packageName),
        formatVersionChange(state.versionToReplace, pkg.packageVersion)
      );
    }
  }
}
