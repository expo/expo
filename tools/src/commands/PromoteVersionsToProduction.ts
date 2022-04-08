import { Command } from '@expo/commander';
import { Config, Versions } from '@expo/xdl';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as jsondiffpatch from 'jsondiffpatch';

import { STAGING_API_HOST, PRODUCTION_API_HOST } from '../Constants';

async function action() {
  // Get from staging
  Config.api.host = STAGING_API_HOST;
  const versionsStaging = await Versions.versionsAsync();

  // since there is only one versions cache, we need to wait a small
  // amount of time so that the cache is invalidated before fetching from prod
  await new Promise((resolve) => setTimeout(resolve, 10));

  Config.api.host = PRODUCTION_API_HOST;
  const versionsProd = await Versions.versionsAsync();
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
      chalk.blue(`https://${PRODUCTION_API_HOST}/--/api/v2/versions`)
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
