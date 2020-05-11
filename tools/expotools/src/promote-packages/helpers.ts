import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';
import stripAnsi from 'strip-ansi';

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
 * Prompts the user to select packages to promote or demote.
 */
export async function promptForPackagesToPromoteAsync(parcels: Parcel[]): Promise<string[]> {
  const maxLength = parcels.reduce((acc, { pkg }) => Math.max(acc, pkg.packageName.length), 0);
  const choices = parcels.map(({ pkg, state }) => {
    const action = state.isDemoting ? red.bold('demoted') : green.bold('promoted');

    return {
      name: `will be ${green(pkg.packageName.padEnd(maxLength))} ${action} ${formatVersionChange(
        state.versionToReplace,
        pkg.packageVersion
      )}`,
      value: pkg.packageName,
      checked: !state.isDemoting,
    };
  });
  const { selectedPackageNames } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPackageNames',
      message: 'Which packages do you want to promote?\n',
      choices: [
        // Choices unchecked by default (these being demoted) should be on top.
        // We could sort them, but JS sorting algorithm is unstable :/
        ...choices.filter((choice) => !choice.checked),
        ...choices.filter((choice) => choice.checked),
      ],
      pageSize: Math.max(15, (process.stdout.rows ?? 15) - 15),
    },
  ]);
  // Inquirer shows all those selected choices by name and that looks so ugly due to line wrapping.
  // If possible, we clear everything that has been printed after the prompt.
  if (process.stdout.columns) {
    const bufferLength = choices.reduce(
      (acc, choice) => acc + stripAnsi(choice.name).length + 2,
      0
    );
    readline.moveCursor(process.stdout, 0, -Math.ceil(bufferLength / process.stdout.columns));
    readline.clearScreenDown(process.stdout);
  }
  return selectedPackageNames;
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
