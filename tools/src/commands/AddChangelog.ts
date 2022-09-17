import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer, { QuestionCollection } from 'inquirer';
import path from 'path';

import * as Changelogs from '../Changelogs';
import * as Directories from '../Directories';
import { formatChangelogEntry } from '../Formatter';
import logger from '../Logger';

type ActionOptions = {
  packageNames: string[];
  // true means that the user didn't use --pull-request or --no-pull-request
  // unfortunately, we can't change this value
  pullRequest: number[] | true;
  author: string[];
  entry: string;
  type: string;
  version: string;
};

async function checkOrAskForOptions(options: ActionOptions): Promise<ActionOptions> {
  const lengthValidator = (x: { length: number }) => x.length !== 0;
  const stringValidator = {
    filter: (s: string) => s.trim(),
    validate: lengthValidator,
  };

  const questions: QuestionCollection[] = [];
  if (options.packageNames.length === 0) {
    questions.push({
      type: 'input',
      name: 'package',
      message: 'What are the packages that you want to add a changelog entry?',
      ...stringValidator,
      transformer(input) {
        return input.split(/\s+/g);
      },
    });
  }

  if (options.pullRequest === true) {
    questions.push({
      type: 'input',
      name: 'pullRequest',
      message: 'What is the pull request number?',
      filter: (pullRequests) =>
        pullRequests
          .split(',')
          .map((pr) => parseInt(pr, 10))
          .filter(Boolean),
      validate: lengthValidator,
    });
  }

  if (!options.author.length) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'Who is the author?',
      filter: (authors) =>
        authors
          .split(',')
          .map((author) => author.trim())
          .filter(Boolean),
      validate: lengthValidator,
    });
  }

  if (!options.entry) {
    questions.push({
      type: 'input',
      name: 'entry',
      message: 'What is the changelog message?',
      ...stringValidator,
    });
  }

  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'What is the type?',
      choices: ['bug-fix', 'new-feature', 'breaking-change', 'library-upgrade', 'notice', 'other'],
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
    case 'library-upgrade':
      return Changelogs.ChangeType.LIBRARY_UPGRADES;
    case 'notice':
      return Changelogs.ChangeType.NOTICES;
    case 'other':
      return Changelogs.ChangeType.OTHERS;
  }
  return null;
}

async function action(packageNames: string[], options: ActionOptions) {
  options.packageNames = packageNames;

  if (!process.env.CI) {
    options = await checkOrAskForOptions(options);
  }
  if (options.packageNames.length === 0) {
    throw new Error('No packages provided');
  }
  if (!options.author.length || !options.entry || !options.type || options.pullRequest === true) {
    throw new Error(
      `Must run with --entry <string> --author <string> --pull-request <number> --type <string>`
    );
  }

  const type = toChangeType(options.type);
  if (!type) {
    throw new Error(`Invalid type: ${chalk.cyan(options.type)}`);
  }

  for (const packageName of options.packageNames) {
    const packagePath = path.join(Directories.getPackagesDir(), packageName, 'CHANGELOG.md');
    if (!(await fs.pathExists(packagePath))) {
      throw new Error(`Package ${chalk.green(packageName)} doesn't have changelog file.`);
    }

    const changelog = Changelogs.loadFrom(packagePath);

    const message = options.entry.slice(-1) === '.' ? options.entry : `${options.entry}.`;
    const insertedEntries = await changelog.insertEntriesAsync(options.version, type, null, [
      {
        message,
        pullRequests: options.pullRequest,
        authors: options.author,
      },
    ]);

    if (insertedEntries.length > 0) {
      await changelog.saveAsync();

      logger.info(
        `\n➕ Inserted ${chalk.magenta(options.type)} entry to ${chalk.green(packageName)}:`
      );
      insertedEntries.forEach((entry) => {
        logger.log('  ', formatChangelogEntry(Changelogs.getChangeEntryLabel(entry)));
      });
    } else {
      logger.info(`\n👌 Specified entry is already added to ${chalk.green(packageName)} changelog`);
    }
  }
}

export default (program: Command) => {
  program
    .command('add-changelog [packageNames...]')
    .alias('ac')
    .description('Adds changelog entry to the package.')
    .option('-e, --entry <string>', 'Change note to put into the changelog.')
    .option(
      '-a, --author <string>',
      "GitHub's user name of someone who made this change. Can be passed multiple times.",
      (value, previous) => previous.concat(value),
      []
    )
    .option(
      '-p, --pull-request <number>',
      'Pull request number. Can be passed multiple times.',
      (value, previous) => {
        if (typeof previous === 'boolean') {
          return [parseInt(value, 10)];
        }

        return previous.concat(parseInt(value, 10));
      }
    )
    .option(
      '--no-pull-request',
      'If changes were pushed directly to the main.',
      (value, previous) => {
        // we need to change how no-flag works in commander to be able to pass an array
        if (!value) {
          return [];
        }
        return previous;
      }
    )
    .option(
      '-t, --type <string>',
      'Type of change that determines the section into which the entry should be added. Possible options: bug-fix | new-feature | breaking-change | library-upgrade | notice | other.'
    )
    .option(
      '-v, --version [string]',
      'Version in which the change was made.',
      Changelogs.UNPUBLISHED_VERSION_NAME
    )

    .asyncAction(action);
};
