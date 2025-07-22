import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import semver from 'semver';

import { Template } from '../../ProjectTemplates';
import { sdkVersionAsync } from '../../ProjectVersions';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { checkPackageAccess } from './checkPackageAccess';
import { updateProjectTemplates } from './updateProjectTemplates';

async function promptToUseNextTag(): Promise<boolean> {
  const choices = ['Tag this version only as "next"', 'Keep previous selections'];
  const { selection } = await inquirer.prompt<{ selection: string }>([
    {
      type: 'list',
      name: 'selection',
      message: 'This version string appears to be prerelease. Options:',
      choices,
    },
  ]);
  return selection === choices[0];
}

async function promptForCustomTagAsync(): Promise<string> {
  const { customTag } = await inquirer.prompt<{ customTag: string }>([
    {
      type: 'input',
      name: 'customTag',
      message: 'Enter custom tag string:',
      default: 'custom',
      validate(value: string) {
        if (!value.match(/[a-zA-Z]/)) {
          return 'Tag must have at least one alpha character';
        }
        if (value[0].match(/[0-9]/)) {
          return `${value} starts with a number and is not recommended as a tag.`;
        }
        if (value[0] === 'v') {
          return `${value} starts with "v" and is not recommended as a tag.`;
        }
        if (semver.valid(value)) {
          return `${value} is a version string and not recommended as a tag.`;
        }
        return true;
      },
    },
  ]);
  return customTag;
}

/**
 * Publishes project templates under `templates` directory.
 */
export const publishProjectTemplates = new Task<TaskArgs>(
  {
    name: 'publishProjectTemplates',
    dependsOn: [updateProjectTemplates, checkPackageAccess],
    filesToStage: ['templates/**/package.json'],
  },
  async (parcels: Parcel[], options: CommandOptions, templates: Template[]) => {
    const expoVersion = await sdkVersionAsync();
    const sdkTag = `sdk-${semver.major(expoVersion)}`;

    const tagOptions = new Map<string, string[]>();
    tagOptions.set(`${sdkTag} and latest`, [sdkTag, 'latest']);
    tagOptions.set(`${sdkTag} and beta and next`, [sdkTag, 'beta', 'next']);
    tagOptions.set(sdkTag, [sdkTag]);

    const { tagChoice } = await inquirer.prompt<{ tagChoice: string }>([
      {
        type: 'list',
        name: 'tagChoice',
        prefix: '❔',
        message: 'Which tags would you like to use for templates?',
        choices: [...tagOptions.keys(), 'custom'],
      },
    ]);

    const tags =
      tagChoice === 'custom' ? [await promptForCustomTagAsync()] : tagOptions.get(tagChoice);

    const npmPublishTag = tags ? tags[0] : sdkTag; // Will either be the sdk-xx tag, or a custom string

    console.log('\nFollowing project templates will be published:');
    console.log(templates.map(({ name }) => chalk.green(name)).join(chalk.grey(', ')));
    console.log(
      `with ${chalk.blue(`${tags?.length || 0}`)} tags (${chalk.blue(tags?.join(', '))})`,
      '\n'
    );
    const npmCommandParams: { path: string; args: string[] }[] = [];

    for (const template of templates) {
      const newVersion = await JsonFile.getAsync(
        path.join(template.path, 'package.json'),
        'version',
        undefined
      );

      const choseNextTag = semver.prerelease(newVersion) ? await promptToUseNextTag() : false;

      const moreArgs: string[] = [];

      // Assign custom tag in the publish command, so we don't accidentally publish as latest.
      moreArgs.push('--tag', choseNextTag ? 'next' : npmPublishTag);

      // Publish to NPM registry
      const publishCommandArgs: string[] = ['publish', '--access', 'public', ...moreArgs];
      npmCommandParams.push({ path: template.path, args: publishCommandArgs });

      if (tags && tags.length > 1 && !choseNextTag) {
        // If 'next', do not add 'latest' or 'beta'
        // Additional tag (latest, beta) is added here
        const [, ...additionalTags] = tags;
        additionalTags.forEach((tag) => {
          const tagCommandArgs: string[] = [
            'dist-tag',
            'add',
            `${template.name}@${newVersion}`,
            `${tag}`,
          ];
          npmCommandParams.push({ path: template.path, args: tagCommandArgs });
        });
      }
    }

    for (const params of npmCommandParams) {
      // Safety first:
      // If options.dry, don't actually execute npm even if user says yes above
      if (options.dry) {
        await spawnAsync('echo', params.args, {
          stdio: 'inherit',
          cwd: params.path,
        });
      } else {
        await spawnAsync('npx', ['npm@8', ...params.args], {
          stdio: 'inherit',
          cwd: params.path,
        });
      }
    }
  }
);
