import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import prompts from 'prompts';

import * as Template from './Template';
import { Log } from './log';
import { formatSelfCommand } from './resolvePackageManager';
import { getConflictsForDirectory } from './utils/dir';

export function assertValidName(folderName: string) {
  const validation = Template.validateName(folderName);
  if (typeof validation === 'string') {
    Log.exit(chalk`{red Cannot create an app named {bold "${folderName}"}. ${validation}}`, 1);
  }
  const isFolderNameForbidden = Template.isFolderNameForbidden(folderName);
  if (isFolderNameForbidden) {
    Log.exit(
      chalk`{red Cannot create an app named {bold "${folderName}"} because it would conflict with a dependency of the same name.}`,
      1
    );
  }
}

export function assertFolderEmpty(projectRoot: string, folderName: string) {
  const conflicts = getConflictsForDirectory(projectRoot);
  if (conflicts.length) {
    Log.log(chalk`The directory {cyan ${folderName}} has files that might be overwritten:`);
    Log.log();
    for (const file of conflicts) {
      Log.log(`  ${file}`);
    }
    Log.log();
    Log.exit('Try using a new directory name, or moving these files.\n');
  }
}

export async function resolveProjectRootAsync(input: string): Promise<string> {
  let name = input?.trim();

  if (!name) {
    const { answer } = await prompts({
      type: 'text',
      name: 'answer',
      message: 'What is your app named?',
      initial: 'my-app',
      validate: name => {
        const validation = Template.validateName(path.basename(path.resolve(name)));
        if (typeof validation === 'string') {
          return 'Invalid project name: ' + validation;
        }
        return true;
      },
    });

    if (typeof answer === 'string') {
      name = answer.trim();
    }
  }

  if (!name) {
    const selfCmd = formatSelfCommand();
    Log.log();
    Log.log('Please choose your app name:');
    Log.log(chalk`  {dim $} {cyan ${selfCmd} <name>}`);
    Log.log();
    Log.log(`For more info, run:`);
    Log.log(chalk`  {dim $} {cyan ${selfCmd} --help}`);
    Log.log();
    Log.exit('');
  }

  const projectRoot = path.resolve(name);
  const folderName = path.basename(projectRoot);

  assertValidName(folderName);

  await fs.promises.mkdir(projectRoot, { recursive: true });

  assertFolderEmpty(projectRoot, folderName);

  return projectRoot;
}
