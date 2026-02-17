import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import { runCommand } from './commands';
import CLIError from './error';
import { withSpinner } from './spinner';
import type { AndroidConfig, BuildVariant } from './types';

export const buildPublishingTask = (variant: BuildVariant, repository: string): string => {
  const repositoryName = repository === 'MavenLocal' ? repository : `${repository}Repository`;
  return `publishBrownfield${variant}PublicationTo${repositoryName}`;
};

export const findBrownfieldLibrary = (): string | undefined => {
  try {
    const androidPath = path.join(process.cwd(), 'android');
    if (!fs.existsSync(androidPath)) {
      CLIError.handle('android-directory-not-found');
    }

    const subdirectories = fs
      .readdirSync(androidPath, { withFileTypes: true })
      .filter((item) => item.isDirectory());
    const brownfieldLibrary = subdirectories.find((directory) => {
      const directoryPath = path.join(androidPath, directory.name);
      const files = fs.readdirSync(directoryPath, { recursive: true });
      return files.some(
        (file) => typeof file === 'string' && file.endsWith('ReactNativeHostManager.kt')
      );
    });

    if (brownfieldLibrary) {
      return brownfieldLibrary.name;
    }

    CLIError.handle('android-library-not-found');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '';
    CLIError.handle('android-library-unknown-error', errorMessage);
  }
};

export const printAndroidConfig = (config: AndroidConfig) => {
  console.log(chalk.bold('Resolved build configuration'));
  console.log(` - Build variant: ${chalk.blue(config.variant)}`);
  console.log(` - Library: ${chalk.blue(config.library)}`);
  console.log(` - Verbose: ${chalk.blue(config.verbose)}`);
  console.log(` - Dry run: ${chalk.blue(config.dryRun)}`);
  console.log(` - Tasks:`);
  config.tasks.forEach((task) => {
    console.log(`   - ${chalk.blue(task)}`);
  });
  console.log();
};

export const processRepositories = (tasks: string[]): string[] => {
  const splitRegex = /^publishBrownfield(?:All|Debug|Release)PublicationTo(.+?)(?:Repository)?$/;
  return Array.from(
    new Set(
      tasks
        .map((task) => {
          return splitRegex.exec(task)?.[1];
        })
        .filter((repo) => repo !== undefined)
    )
  );
};

export const processTasks = (stdout: string): string[] => {
  const regex = /^publishBrownfield[a-zA-Z0-9_-]*/i;
  return (
    stdout
      .split('\n')
      .map((line) => regex.exec(line)?.[0])
      // Remove duplicate maven local tasks
      .filter((task) => task !== undefined)
      .filter((task) => !task.includes('MavenLocalRepository'))
  );
};

export const runTask = async (task: string, verbose: boolean, dryRun: boolean) => {
  if (dryRun) {
    console.log(`./gradlew ${task}`);
    return;
  }

  return withSpinner({
    operation: () =>
      runCommand('./gradlew', [task], {
        cwd: path.join(process.cwd(), 'android'),
        verbose,
      }),
    loaderMessage: 'Running task: ' + task,
    successMessage: 'Running task: ' + task + ' succeeded',
    errorMessage: 'Running task: ' + task + ' failed',
    verbose,
  });
};
