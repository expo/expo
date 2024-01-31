import chalk from 'chalk';
import inquirer from 'inquirer';
import readline from 'readline';
import stripAnsi from 'strip-ansi';

import { findPackagesToPromote } from './findPackagesToPromote';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { formatVersionChange } from '../helpers';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { green, red } = chalk;

/**
 * Prompts the user to select packages to promote or demote.
 * It's skipped if `--no-select` option is used or it's run on the CI.
 */
export const selectPackagesToPromote = new Task<TaskArgs>(
  {
    name: 'selectPackagesToPromote',
    dependsOn: [findPackagesToPromote],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | TaskArgs> => {
    if (!options.select || process.env.CI) {
      return [parcels, options];
    }

    logger.info('\n👉 Selecting packages to promote...\n');

    const packageNames = await promptForPackagesToPromoteAsync(parcels);
    const newParcels = parcels.filter(({ pkg }) => packageNames.includes(pkg.packageName));

    return [newParcels, options];
  }
);

/**
 * Prompts the user to select packages to promote or demote.
 */
async function promptForPackagesToPromoteAsync(parcels: Parcel[]): Promise<string[]> {
  const maxLength = parcels.reduce((acc, { pkg }) => Math.max(acc, pkg.packageName.length), 0);
  const choices = parcels.map(({ pkg, state }) => {
    const action = state.isDemoting ? red.bold('demote') : green.bold('promote');

    return {
      name: `${green(pkg.packageName.padEnd(maxLength))} ${action} ${formatVersionChange(
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
      message: 'Which packages do you want to promote?\n  ● selected ○ unselected\n',
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
