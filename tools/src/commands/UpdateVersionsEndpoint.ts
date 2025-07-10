import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as jsondiffpatch from 'jsondiffpatch';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
import unset from 'lodash/unset';
import semver from 'semver';

import * as Versions from '../Versions';

type ActionOptions = {
  sdkVersion: string;
  root: boolean;
  deprecated?: boolean;
  releaseNoteUrl?: string;
  key?: string;
  value?: any;
  delete: boolean;
  deleteSdk: boolean;
  reset: boolean;
};

async function chooseSdkVersionAsync(sdkVersions: string[]): Promise<string> {
  const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
    {
      type: 'list',
      name: 'sdkVersion',
      default: sdkVersions[0],
      choices: sdkVersions,
    },
  ]);
  return sdkVersion;
}

async function askForCorrectnessAsync(): Promise<boolean> {
  const { isCorrect } = await inquirer.prompt<{ isCorrect: boolean }>([
    {
      type: 'confirm',
      name: 'isCorrect',
      message: `Does this look correct? Type \`y\` or press enter to update ${chalk.green(
        'staging'
      )} config.`,
      default: true,
    },
  ]);
  return isCorrect;
}

function setConfigValueForKey(config: object, key: string, value: any): void {
  if (value === undefined) {
    console.log(`Deleting ${chalk.yellow(key)} config key ...`);
    unset(config, key);
  } else {
    console.log(`Changing ${chalk.yellow(key)} config key ...`);
    set(config, key, value);
  }
}

async function applyChangesToStagingAsync(delta: any, previousVersions: any, newVersions: any) {
  if (!delta) {
    console.log(chalk.yellow('There are no changes to apply in the configuration.'));
    return;
  }

  console.log(
    `\nHere is the diff of changes to apply on ${chalk.green('staging')} version config:`
  );
  console.log(jsondiffpatch.formatters.console.format(delta!, previousVersions));

  const isCorrect = await askForCorrectnessAsync();

  if (isCorrect) {
    // Save new configuration.
    try {
      await Versions.setVersionsAsync(newVersions);
    } catch (error) {
      console.error(error);
    }

    console.log(
      chalk.green('\nSuccessfully updated staging config. You can check it out on'),
      chalk.blue(`https://${Versions.VersionsApiHost.STAGING}/v2/versions`)
    );
  } else {
    console.log(chalk.yellow('Canceled'));
  }
}

async function resetStagingConfigurationAsync() {
  // Get current production config.
  const productionVersions = await Versions.getVersionsAsync(Versions.VersionsApiHost.PRODUCTION);

  // Get current staging config.
  const stagingVersions = await Versions.getVersionsAsync(Versions.VersionsApiHost.STAGING);

  // Calculate the diff between them.
  const delta = jsondiffpatch.diff(stagingVersions, productionVersions);

  // Reset changes (if any) on staging.
  await applyChangesToStagingAsync(delta, stagingVersions, productionVersions);
}

async function applyChangesToRootAsync(options: ActionOptions, versions: any) {
  const newVersions = cloneDeep(versions);
  if (options.key) {
    if (!('value' in options) && !options.delete) {
      console.log(chalk.red('`--key` flag requires `--value` or `--delete` flag.'));
      return;
    }
    setConfigValueForKey(newVersions, options.key, options.delete ? undefined : options.value);
  }

  const delta = jsondiffpatch.diff(versions, newVersions);

  await applyChangesToStagingAsync(delta, versions, newVersions);
}

async function applyChangesToSDKVersionAsync(options: ActionOptions, versions: any) {
  const sdkVersions = Object.keys(versions.sdkVersions).sort(semver.rcompare);
  const sdkVersion = options.sdkVersion || (await chooseSdkVersionAsync(sdkVersions));
  const containsSdk = sdkVersions.includes(sdkVersion);

  if (!semver.valid(sdkVersion)) {
    console.error(chalk.red(`Provided SDK version ${chalk.cyan(sdkVersion)} is invalid.`));
    return;
  }
  if (!containsSdk) {
    const { addNewSdk } = await inquirer.prompt<{ addNewSdk: boolean }>([
      {
        type: 'confirm',
        name: 'addNewSdk',
        message: `Configuration for SDK ${chalk.cyan(
          sdkVersion
        )} doesn't exist. Do you want to initialize it?`,
        default: true,
      },
    ]);
    if (!addNewSdk) {
      console.log(chalk.yellow('Canceled'));
      return;
    }
  }

  // If SDK is already there, make a deep clone of the sdkVersion config so we can calculate a diff later.
  const sdkVersionConfig = containsSdk ? cloneDeep(versions.sdkVersions[sdkVersion]) : {};

  console.log(`\nUsing ${chalk.blue(Versions.VersionsApiHost.STAGING)} host ...`);
  console.log(`Using SDK ${chalk.cyan(sdkVersion)} ...`);

  if ('deprecated' in options) {
    setConfigValueForKey(sdkVersionConfig, 'isDeprecated', !!options.deprecated);
  }
  if ('releaseNoteUrl' in options && typeof options.releaseNoteUrl === 'string') {
    setConfigValueForKey(sdkVersionConfig, 'releaseNoteUrl', options.releaseNoteUrl);
  }
  if (options.key) {
    if (!('value' in options) && !options.delete) {
      console.log(chalk.red('`--key` flag requires `--value` or `--delete` flag.'));
      return;
    }
    setConfigValueForKey(sdkVersionConfig, options.key, options.delete ? undefined : options.value);
  }

  const newVersions = {
    ...versions,
    sdkVersions: {
      ...versions.sdkVersions,
      [sdkVersion]: sdkVersionConfig,
    },
  };

  if (options.deleteSdk) {
    delete newVersions.sdkVersions[sdkVersion];
  }

  const delta = jsondiffpatch.diff(
    versions.sdkVersions[sdkVersion],
    newVersions.sdkVersions[sdkVersion]
  );

  await applyChangesToStagingAsync(delta, versions.sdkVersions[sdkVersion], newVersions);
}

async function action(options: ActionOptions) {
  if (options.reset) {
    await resetStagingConfigurationAsync();
    return;
  }

  const versions = await Versions.getVersionsAsync(Versions.VersionsApiHost.STAGING);

  if (options.root) {
    await applyChangesToRootAsync(options, versions);
  } else {
    await applyChangesToSDKVersionAsync(options, versions);
  }
}

export default (program: Command) => {
  program
    .command('update-versions-endpoint')
    .alias('update-versions')
    .description(
      `Updates SDK configuration under ${chalk.blue(`https://${Versions.VersionsApiHost.STAGING}/v2/versions`)}`
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version to update. Can be chosen from the list if not provided.'
    )
    .option(
      '--root',
      'Modify a key at the root of the versions config rather than a specific SDK version.',
      false
    )
    .option('-d, --deprecated [boolean]', 'Sets chosen SDK version as deprecated.')
    .option('-r, --release-note-url [string]', 'URL pointing to the release blog post.')
    .option('-k, --key [string]', 'A custom, dotted key that you want to set in the configuration.')
    .option('-v, --value [any]', 'Value for the custom key to be set in the configuration.')
    .option('--delete', 'Deletes config entry under key specified by `--key` flag.', false)
    .option(
      '--delete-sdk',
      'Deletes configuration for SDK specified by `--sdkVersion` flag.',
      false
    )
    .option('--reset', 'Resets changes on staging to the state from production.', false)
    .asyncAction(action);
};
