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
      message: `Continue with uncommited changes?`,
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
    return true;
  } else if (workingTreeStatus === 'dirty') {
    logWarning(
      'Git branch has uncommited file changes',
      `It's recommended to commit all changes before proceeding in case you want to revert generated changes.`
    );
  } else {
    logWarning(
      'No git repo found in current directory',
      `Use git to track file changes before running commands that modify project files.`
    );
  }

  return false;
}

function logWarning(warning: string, hint: string) {
  Log.warn(chalk.bold`! ` + warning);
  Log.log(chalk.gray`\u203A ` + chalk.gray(hint));
}
