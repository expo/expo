import { Command } from '@expo/commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR } from '../Constants';
import * as Directories from '../Directories';
import Git, { GitDirectory } from '../Git';
import logger from '../Logger';
import { spawnAsync } from '../Utils';
import { action as podInstallAsync } from './PodInstallCommand';

type PreconditionsInput = {
  branchName: string;
  dirtyFiles: string[];
  force: boolean;
};

type PreconditionsResult = {
  warning: string | null;
  error: string | null;
};

export function validatePreconditions({
  branchName,
  dirtyFiles,
  force,
}: PreconditionsInput): PreconditionsResult {
  const warning = /^sdk-\d+/.test(branchName)
    ? null
    : `Current branch "${branchName}" is not an SDK branch. Proceeding anyway.`;

  const error =
    dirtyFiles.length > 0 && !force
      ? `The working tree has uncommitted changes that this command would discard:\n${dirtyFiles.join(
          '\n'
        )}\nCommit or stash them first, or re-run with --force to discard them.`
      : null;

  return { warning, error };
}

type ActionOptions = {
  force: boolean;
};

type Step = {
  title: string;
  runAsync: () => Promise<void>;
};

const PODS_PATHS = [
  'apps/bare-expo/ios/Pods',
  'apps/bare-expo/ios/build',
  'apps/expo-go/ios/Pods',
  'apps/expo-go/ios/build',
];

function createSteps(): Step[] {
  const reactNativeDir = Directories.getReactNativeSubmoduleDir();
  const jsiAppleDir = path.join(Directories.getPackagesDir(), 'expo-modules-jsi', 'apple');
  const precompileDir = Directories.getPrecompileDir();

  return [
    {
      title: 'Removing node_modules and resetting tracked files',
      async runAsync() {
        logger.info(`   Removing ${chalk.yellow('node_modules')}`);
        await fs.remove(path.join(EXPO_DIR, 'node_modules'));
        await Git.runAsync(['checkout', '.']);
      },
    },
    {
      title: 'Cleaning react-native-lab and reinstalling its dependencies',
      async runAsync() {
        const reactNativeGit = new GitDirectory(reactNativeDir);
        await reactNativeGit.runAsync(['clean', '-fdx'], { stdio: 'inherit' });
        await spawnAsync('yarn', [], { cwd: reactNativeDir, stdio: 'inherit' });
      },
    },
    {
      title: 'Installing workspace dependencies',
      async runAsync() {
        await spawnAsync('pnpm', ['install'], { cwd: EXPO_DIR, stdio: 'inherit' });
      },
    },
    {
      title: 'Resyncing pods with the native projects',
      async runAsync() {
        if (process.platform !== 'darwin') {
          logger.warn('Skipping pods resync (macOS only).');
          return;
        }
        for (const podsPath of PODS_PATHS) {
          await fs.remove(path.join(EXPO_DIR, podsPath));
        }
        const success = await podInstallAsync({ force: true, verbose: false, all: false });

        if (!success) {
          throw new Error('pod install failed. See the output above.');
        }
      },
    },
    {
      title: 'Removing expo-modules-jsi build artifacts',
      async runAsync() {
        for (const name of ['.DerivedData', '.generated', '.swiftpm', 'Products']) {
          await fs.remove(path.join(jsiAppleDir, name));
        }
      },
    },
    {
      title: 'Removing precompile caches',
      async runAsync() {
        for (const name of ['.build', '.cache']) {
          await fs.remove(path.join(precompileDir, name));
        }
      },
    },
  ];
}

async function action(options: ActionOptions) {
  const branchName = await Git.getCurrentBranchNameAsync();
  const { stdout } = await Git.runAsync(['status', '--porcelain', '--untracked-files=no']);
  const dirtyFiles = stdout.trim().split('\n').filter(Boolean);

  const { warning, error } = validatePreconditions({
    branchName,
    dirtyFiles,
    force: options.force,
  });

  if (warning) {
    logger.warn(`⚠️  ${warning}`);
  }
  if (error) {
    throw new Error(error);
  }

  const steps = createSteps();

  for (const [index, step] of steps.entries()) {
    logger.info(chalk.bold(`\n[${index + 1}/${steps.length}]`), step.title);

    try {
      await step.runAsync();
    } catch (e) {
      logger.error(
        `💥 Step "${step.title}" failed. Fix the issue above and re-run \`et prepare-branch -f\`.`
      );
      throw e;
    }
  }
  logger.success('\n🧹 Branch is clean and ready for publishing');
}

export default (program: Command) => {
  program
    .command('prepare-branch')
    .alias('pb')
    .description(
      'Cleans and reinstalls dependencies, pods and build caches before publishing from an SDK branch'
    )
    .option(
      '-f, --force',
      'Whether to proceed even if the working tree has uncommitted changes',
      false
    )
    .asyncAction(action);
};
