import { Command } from '@expo/commander';
import inquirer from 'inquirer';
import * as jsondiffpatch from 'jsondiffpatch';
import { styleText } from 'node:util';

import * as Versions from '../Versions';

async function action() {
  const versionsStaging = await Versions.getVersionsAsync(Versions.VersionsApiHost.STAGING);
  const versionsProd = await Versions.getVersionsAsync(Versions.VersionsApiHost.PRODUCTION);
  const delta = jsondiffpatch.diff(versionsProd, versionsStaging);

  if (!delta) {
    console.log(styleText('yellow', 'There are no changes to apply in the configuration.'));
    return;
  }

  console.log(
    `Here is the diff from ${styleText('green', 'staging')} -> ${styleText('green', 'production')}:`
  );
  console.log(jsondiffpatch.formatters.console.format(delta, versionsProd));

  const { isCorrect } = await inquirer.prompt<{ isCorrect: boolean }>([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: `Does this look correct? Type \`y\` to update ${styleText('green', 'production')} config.`,
      default: false,
    },
  ]);

  if (isCorrect) {
    // Promote staging configuration to production.
    await Versions.setVersionsAsync(versionsStaging, Versions.VersionsApiHost.PRODUCTION);

    console.log(
      styleText('green', '\nSuccessfully updated production config. You can check it out on'),
      styleText('blue', `https://${Versions.VersionsApiHost.PRODUCTION}/v2/versions`)
    );
  } else {
    console.log(styleText('yellow', 'Canceled'));
  }
}

export default (program: Command) => {
  program
    .command('promote-versions-to-production')
    .alias('promote-versions-to-prod', 'promote-versions')
    .description('Promotes the latest versions config from staging to production.')
    .asyncAction(action);
};
