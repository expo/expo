import { styleText } from 'node:util';

import { Parcel } from './types';
import * as Changelogs from '../Changelogs';
import { GitDirectory } from '../Git';
import logger from '../Logger';
import { Package } from '../Packages';

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
  const from = fromVersion
    ? styleText(['cyan', 'bold'], fromVersion)
    : styleText(['gray', 'bold'], 'none');
  const to = styleText(['cyan', 'bold'], toVersion);
  return `from ${from} to ${to}`;
}

/**
 * Prints a lists of packages to promote or demote.
 */
export function printPackagesToPromote(parcels: Parcel[]): void {
  const toPromote = parcels.filter(({ state }) => !state.isDemoting);
  const toDemote = parcels.filter(({ state }) => state.isDemoting);

  printPackagesToPromoteInternal(
    toPromote,
    `Following packages would be ${styleText(['green', 'bold'], 'promoted')}:`
  );
  printPackagesToPromoteInternal(
    toDemote,
    `Following packages could be ${styleText(['red', 'bold'], 'demoted')} ${styleText('gray', `(requires --demote flag)`)}:`
  );
}

function printPackagesToPromoteInternal(parcels: Parcel[], headerText: string): void {
  if (parcels.length > 0) {
    logger.log('  ', styleText('magenta', headerText));

    const sorted = [...parcels].sort((a, b) => a.pkg.packageName.localeCompare(b.pkg.packageName));

    for (const { pkg, state } of sorted) {
      logger.log(
        '    ',
        styleText('green', pkg.packageName),
        formatVersionChange(state.versionToReplace, pkg.packageVersion)
      );
    }
  }
}
