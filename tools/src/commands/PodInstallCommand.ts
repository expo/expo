import { Command } from '@expo/commander';
import chalk from 'chalk';
import { hashElement } from 'folder-hash';
import path from 'path';
import process from 'process';

import { podInstallAsync } from '../CocoaPods';
import { EXPO_DIR } from '../Constants';
import logger from '../Logger';

type ActionOptions = {
  force: boolean;
  verbose: boolean;
};

async function action(options: ActionOptions) {
  if (process.platform !== 'darwin') {
    throw new Error('This command is not supported on this platform.');
  }

  for (const relativeProjectPath of ['ios', 'apps/bare-expo/ios']) {
    const absoluteProjectPath = path.join(EXPO_DIR, relativeProjectPath);
    const podfileLockHash = await md5(path.join(absoluteProjectPath, 'Podfile.lock'));
    const manifestLockHash = await md5(path.join(absoluteProjectPath, 'Pods/Manifest.lock'));

    if (!manifestLockHash || podfileLockHash !== manifestLockHash || options.force) {
      logger.info(`🥥 Installing pods in ${chalk.yellow(relativeProjectPath)} directory`);

      try {
        await podInstallAsync(absoluteProjectPath, {
          stdio: options.verbose ? 'inherit' : 'pipe',
        });
      } catch (e) {
        if (!options.verbose) {
          // In this case, the output has already been printed.
          logger.error(`💥 Installation failed with output: ${e.output}`);
        }
        return;
      }
    }
  }
  logger.success('🥳 All iOS projects have up-to-date local pods');
}

async function md5(path: string): Promise<string | null> {
  try {
    const { hash } = await hashElement(path, {
      algo: 'md5',
      encoding: 'hex',
      files: {
        ignoreBasename: true,
        ignoreRootName: true,
      },
    });
    return hash;
  } catch {
    return null;
  }
}

export default (program: Command) => {
  program
    .command('pod-install')
    .alias('pods')
    .description('Installs pods in the directories where they are not in-sync')
    .option('-f, --force', 'Whether to force installing pods in all projects.', false)
    .option('-v, --verbose', 'Whether to inherit logs from `pod install` command.', false)
    .asyncAction(action);
};
