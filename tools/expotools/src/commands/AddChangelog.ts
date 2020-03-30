import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';

import * as Changelogs from '../Changelogs';
import * as Directories from '../Directories';

type ActionOptions = {
  package: string;
  pullRequest: number;
  author: string;
  entry: string;
  type: string;
  version?: string;
};

async function checkOrAskForOptins(options: ActionOptions): Promise<ActionOptions> {
  const questions: inquirer.Question[] = [];
  if (!options.package) {
    questions.push({
      type: 'input',
      name: 'package',
      message: 'What is the package that you want to add?',
    });
  }

  if (!options.pullRequest) {
    questions.push({
      type: 'number',
      name: 'pullRequest',
      message: 'What is the pull request number?',
    });
  }

  if (!options.author) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'Who is the author?',
    });
  }

  if (!options.entry) {
    questions.push({
      type: 'input',
      name: 'entry',
      message: 'What is the changelog message?',
    });
  }

  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'What is the type?',
      choices: ['bug-fix', 'new-feature', 'breaking-change'],
    });
  }

  const promptAnswer = questions.length > 0 ? await inquirer.prompt<ActionOptions>(questions) : {};

  return { ...options, ...promptAnswer };
}

function toChangeType(type: string): Changelogs.ChangeType | null {
  switch (type) {
    case 'bug-fix':
      return Changelogs.ChangeType.BUG_FIXES;
    case 'new-feature':
      return Changelogs.ChangeType.NEW_FEATURES;
    case 'breaking-change':
      return Changelogs.ChangeType.BREAKING_CHANGES;
  }
  return null;
}

async function action(options: ActionOptions) {
  if (!process.env.CI) {
    options = await checkOrAskForOptins(options);
  }

  if (
    !options.author ||
    !options.entry ||
    !options.package ||
    !options.pullRequest ||
    !options.type
  ) {
    throw new Error(
      `Must run with --package [string] --entry [string] --author [string] --pullRequest [number] --type [string]`
    );
  }

  const type = toChangeType(options.type);
  if (!type) {
    throw new Error(`Invalid type: ${chalk.cyan(options.type)}`);
  }

  const packegPath = path.join(Directories.getPackagesDir(), options.package, 'CHANGELOG.md');
  if (!(await fs.pathExists(packegPath))) {
    throw new Error(`Path ${chalk.cyan(packegPath)} does not exist.`);
  }

  const changelog = Changelogs.loadFrom(packegPath);
  const newEntry = {
    author: options.author,
    message: options.entry,
    pullRequest: options.pullRequest,
    type,
  };

  if (options.version) {
    await changelog.addChangesAsync(newEntry, options.version);
  } else {
    await changelog.addChangesAsync(newEntry);
  }
}

export default (program: Command) => {
  program
    .command('add-changelog')
    .alias('acl')
    .description('Add an changelog entry.')
    .option(
      '-p --package [string]',
      'Package name. For example `expo-image-picker` or `unimodules-file-system-interface.'
    )
    .option('-e --entry [string]', 'Changelog entry.')
    .option('-a --author [string]', 'Author.')
    .option('-pr --pullRequest [number]', 'Pull request number.')
    .option('-t --type [string]', 'Type of entry: bug-fix|new-feature|breaking-change.')
    .option('-v --version [string]', 'Version.')

    .asyncAction(action);
};
