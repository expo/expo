import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';

import { env } from './env';
import { isInteractive } from './interactive';
import { confirmAsync } from './prompts';
import * as Log from '../log';

export async function maybeBailOnGitStatusAsync(): Promise<boolean> {
  if (env.EXPO_NO_GIT_STATUS) {
    Log.warn(
      'Git status is dirty but the command will continue because EXPO_NO_GIT_STATUS is enabled...'
    );
    return false;
  }
  const isGitStatusClean = await validateGitStatusAsync();

  // Give people a chance to bail out if git working tree is dirty
  if (!isGitStatusClean) {
    if (!isInteractive()) {
      Log.warn(
        `Git status is dirty but the command will continue because the terminal is not interactive.`
      );
      return false;
    }

    Log.log();
    const answer = await confirmAsync({
      message: `Would you like to proceed?`,
    });

    if (!answer) {
      return true;
    }

    Log.log();
  }
  return false;
}

export async function validateGitStatusAsync(): Promise<boolean> {
  let workingTreeStatus = 'unknown';
  try {
    const result = await spawnAsync('git', ['status', '--porcelain']);
    workingTreeStatus = result.stdout === '' ? 'clean' : 'dirty';
  } catch {
    // Maybe git is not installed?
    // Maybe this project is not using git?
  }

  if (workingTreeStatus === 'clean') {
    Log.log(`Your git working tree is ${chalk.green('clean')}`);
    Log.log('To revert the changes after this command completes, you can run the following:');
    Log.log('  git clean --force && git reset --hard');
    return true;
  } else if (workingTreeStatus === 'dirty') {
    Log.log(`${chalk.bold('Warning!')} Your git working tree is ${chalk.red('dirty')}.`);
    Log.log(
      `It's recommended to ${chalk.bold(
        'commit all your changes before proceeding'
      )}, so you can revert the changes made by this command if necessary.`
    );
  } else {
    Log.log("We couldn't find a git repository in your project directory.");
    Log.log("It's recommended to back up your project before proceeding.");
  }

  return false;
}
