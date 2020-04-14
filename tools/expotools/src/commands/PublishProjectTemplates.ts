import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { getAvailableProjectTemplatesAsync } from '../ProjectTemplates';
import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function shouldAssignLatestTagAsync(
  templateName: string,
  templateVersion: string
): Promise<boolean> {
  const { assignLatestTag } = await inquirer.prompt<{ assignLatestTag: boolean }>([
    {
      type: 'confirm',
      name: 'assignLatestTag',
      message: `Do you want to assign ${chalk.blue('latest')} tag to ${chalk.green(
        templateName
      )}@${chalk.red(templateVersion)}?`,
      default: true,
    },
  ]);
  return assignLatestTag;
}

async function action(options) {
  if (!options.sdkVersion) {
    const { version: expoSdkVersion } = await JsonFile.readAsync<{ version: string }>(
      path.join(EXPO_DIR, 'packages/expo/package.json')
    );
    const { sdkVersion } = await inquirer.prompt<{ sdkVersion: string }>([
      {
        type: 'input',
        name: 'sdkVersion',
        message:
          "What is the Expo SDK version the project templates you're going to publish are compatible with?",
        default: `${semver.major(expoSdkVersion)}.0.0`,
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          return true;
        },
      },
    ]);
    options.sdkVersion = sdkVersion;
  }

  const availableProjectTemplates = await getAvailableProjectTemplatesAsync();
  const projectTemplatesToPublish = options.project
    ? availableProjectTemplates.filter(({ name }) => name.includes(options.project))
    : availableProjectTemplates;

  if (projectTemplatesToPublish.length === 0) {
    console.log(
      chalk.yellow('No project templates to publish. Make sure --project flag is correct.')
    );
    return;
  }

  console.log('\nFollowing project templates will be published:');
  console.log(
    projectTemplatesToPublish.map(({ name }) => chalk.green(name)).join(chalk.grey(', ')),
    '\n'
  );

  for (const template of projectTemplatesToPublish) {
    const { newVersion } = await inquirer.prompt<{ newVersion: string }>([
      {
        type: 'input',
        name: 'newVersion',
        message: `What is the new version for ${chalk.green(template.name)} package?`,
        default: semver.lt(template.version, options.sdkVersion)
          ? options.sdkVersion
          : semver.inc(template.version, 'patch'),
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          if (semver.lt(value, template.version)) {
            return `${value} shouldn't be lower than the current version (${template.version})`;
          }
          return true;
        },
      },
    ]);

    // Obtain the tag for the template.
    const { tag } = await inquirer.prompt<{ tag: string }>([
      {
        type: 'input',
        name: 'tag',
        message: `How to tag ${chalk.green(template.name)}@${chalk.red(newVersion)}?`,
        default: semver.prerelease(newVersion) ? 'next' : `sdk-${semver.major(options.sdkVersion)}`,
      },
    ]);

    // Update package version in `package.json`
    await JsonFile.setAsync(path.join(template.path, 'package.json'), 'version', newVersion);

    const appJsonPath = path.join(template.path, 'app.json');
    if (
      (await fs.pathExists(appJsonPath)) &&
      (await JsonFile.getAsync(appJsonPath, 'expo.sdkVersion', null))
    ) {
      // Make sure SDK version in `app.json` is correct
      console.log(
        `Setting ${chalk.magenta('expo.sdkVersion')} to ${chalk.green(
          options.sdkVersion
        )} in template's app.json...`
      );

      await JsonFile.setAsync(
        path.join(template.path, 'app.json'),
        'expo.sdkVersion',
        options.sdkVersion
      );
    }

    console.log(`Publishing ${chalk.green(template.name)}@${chalk.red(newVersion)}...`);

    const moreArgs: string[] = [];

    if (tag) {
      // Assign custom tag in the publish command, so we don't accidentally publish as latest.
      moreArgs.push('--tag', tag);
    }

    // Publish to NPM registry
    options.dry ||
      (await spawnAsync('npm', ['publish', '--access', 'public', ...moreArgs], {
        stdio: 'inherit',
        cwd: template.path,
      }));

    if (tag && (await shouldAssignLatestTagAsync(template.name, newVersion))) {
      console.log(
        `Assigning ${chalk.blue('latest')} tag to ${chalk.green(template.name)}@${chalk.red(
          newVersion
        )}...`
      );

      // Add the latest tag to the new version
      options.dry ||
        (await spawnAsync('npm', ['dist-tag', 'add', `${template.name}@${newVersion}`, 'latest'], {
          stdio: 'inherit',
          cwd: template.path,
        }));
    }
    console.log();
  }
}

export default program => {
  program
    .command('publish-project-templates')
    .alias('publish-templates', 'ppt')
    .option(
      '-s, --sdkVersion [string]',
      'Expo SDK version that the templates are compatible with. (optional)'
    )
    .option('-p, --project [string]', 'Name of the template project to publish. (optional)')
    .option('-d, --dry', 'Run the script in the dry mode, that is without publishing.')
    .description('Publishes project templates under `templates` directory.')
    .asyncAction(action);
};
