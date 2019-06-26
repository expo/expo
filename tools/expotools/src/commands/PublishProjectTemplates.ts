import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import semver from 'semver';
import inquirer from 'inquirer';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';

import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

interface Template {
  name: string;
  version: string;
  path: string;
}

async function getAvailableProjectTemplatesAsync(): Promise<Template[]> {
  const templatesPath = path.join(EXPO_DIR, 'templates');
  const templates = await fs.readdir(templatesPath);

  return Promise.all<Template>(
    templates.map(async (template) => {
      const packageJson = await JsonFile.readAsync(path.join(templatesPath, template, 'package.json'));

      return {
        name: packageJson.name,
        version: packageJson.version,
        path: path.join(templatesPath, template),
      };
    }),
  );
}

async function action(options) {
  if (!options.sdkVersion) {
    const expoSdkVersion = (await JsonFile.readAsync(path.join(EXPO_DIR, 'packages/expo/package.json'))).version;
    const { sdkVersion }: { sdkVersion?: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'sdkVersion',
        message: 'What is the Expo SDK version the project templates you\'re going to publish are compatible with?',
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
  const projectTemplatesToPublish = options.project ? availableProjectTemplates.filter(({ name }) => name.includes(options.project)) : availableProjectTemplates;

  if (projectTemplatesToPublish.length === 0) {
    console.log(chalk.yellow('No project templates to publish. Make sure --project flag is correct.'));
    return;
  }

  console.log('\nFollowing project templates will be published:');
  console.log(projectTemplatesToPublish.map(({ name }) => chalk.green(name)).join(chalk.grey(', ')), '\n');

  for (const template of projectTemplatesToPublish) {
    const { newVersion }: { newVersion?: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newVersion',
        message: `What is the new version for ${chalk.green(template.name)} package?`,
        default: semver.lte(template.version, options.sdkVersion) ? options.sdkVersion : semver.inc(template.version, 'patch'),
        validate(value) {
          if (!semver.valid(value)) {
            return `${value} is not a valid version.`;
          }
          if (semver.lt(value, template.version)) {
            return `${value} shouldn't be lower than the current version (${template.version})`;
          }
          return true;
        },
      }
    ]);

    // Obtain the tag for the template.
    const { tag }: { tag?: string } = await inquirer.prompt([
      {
        type: 'input',
        name: 'tag',
        message: `How to tag ${chalk.green(template.name)}@${chalk.red(newVersion!)}?`,
        default: semver.prerelease(newVersion) ? 'next' : `sdk-${semver.major(options.sdkVersion)}`,
      }
    ]);

    // Update package version in `package.json`
    await JsonFile.setAsync(
      path.join(template.path, 'package.json'),
      'version',
      newVersion,
    );

    // Make sure SDK version in `app.json` is correct
    await JsonFile.setAsync(
      path.join(template.path, 'app.json'),
      'expo.sdkVersion',
      options.sdkVersion
    );

    console.log(
      `Publishing ${chalk.green(template.name)}@${chalk.red(newVersion!)}...`,
    );

    // Publish to NPM registry
    options.dry || await spawnAsync('npm', ['publish', '--access', 'public'], {
      stdio: 'inherit',
      cwd: template.path,
    });

    if (tag) {
      console.log(
        `Assigning ${chalk.blue(tag)} tag to ${chalk.green(template.name)}@${chalk.red(newVersion!)}...`,
      );

      // Add the tag to the new version
      options.dry || await spawnAsync(
        'npm',
        ['dist-tag', 'add', `${template.name}@${newVersion}`, tag],
        {
          stdio: 'inherit',
          cwd: template.path,
        }
      );
    }
    console.log();
  }
}

export default program => {
  program
    .command('publish-project-templates')
    .option(
      '--sdkVersion [string]',
      'Expo SDK version that the templates are compatible with. (optional)'
    )
    .option(
      '--project [string]',
      'Name of the template project to publish. (optional)'
    )
    .option(
      '--dry',
      'Run the script in the dry mode, that is without publishing.'
    )
    .description('Publishes project templates under `templates` directory.')
    .asyncAction(action);
};
