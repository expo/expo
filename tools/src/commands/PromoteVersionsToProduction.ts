import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as jsondiffpatch from 'jsondiffpatch';

import * as Versions from '../Versions';

async function action() {
  const versionsStaging = await Versions.getVersionsAsync(Versions.VersionsApiHost.STAGING);
  const versionsProd = await Versions.getVersionsAsync(Versions.VersionsApiHost.PRODUCTION);
  const delta = jsondiffpatch.diff(versionsProd, versionsStaging);

  if (!delta) {
    console.log(chalk.yellow('There are no changes to apply in the configuration.'));
    return;
  }

  console.log(`Here is the diff from ${chalk.green('staging')} -> ${chalk.green('production')}:`);
  console.log(jsondiffpatch.formatters.console.format(delta, versionsProd));

  const { isCorrect } = await inquirer.prompt<{ isCorrect: boolean }>([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: `Does this look correct? Type \`y\` to update ${chalk.green('production')} config.`,
      default: false,
    },
  ]);

  if (isCorrect) {
    // Promote staging configuration to production.
    await Versions.setVersionsAsync(versionsStaging);

    console.log(
      chalk.green('\nSuccessfully updated production config. You can check it out on'),
      chalk.blue(`https://${Versions.VersionsApiHost.PRODUCTION}/v2/versions`)
    );
  } else {
    console.log(chalk.yellow('Canceled'));
  }
}

export default (program: Command) => {
  program
    .command('promote-versions-to-production')
    .alias('promote-versions-to-prod', 'promote-versions')
    .description('Promotes the latest versions config from staging to production.')
    .asyncAction(action);
};
