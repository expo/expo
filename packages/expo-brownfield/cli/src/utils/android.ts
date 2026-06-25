import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';
import { styleText } from 'node:util';

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
      const directoryPath = path.resolve(androidPath, directory.name);
      const directories = [directoryPath];

      let target: string | undefined;
      while ((target = directories.shift()) != null) {
        const entries = fs.readdirSync(target, { withFileTypes: true });
        for (const entry of entries) {
          const childPath = path.join(target, entry.name);
          if (entry.isDirectory()) {
            directories.push(childPath);
          } else if (entry.isFile()) {
            if (entry.name === 'ReactNativeHostManager.kt') return true;
          }
        }
      }

      return false;
    });

    if (brownfieldLibrary) {
      return brownfieldLibrary.name;
    }

    CLIError.handle('android-library-not-found');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '';
    CLIError.handle('android-library-unknown-error', errorMessage);
  }

  return;
};

export const printAndroidConfig = (config: AndroidConfig) => {
  console.log(styleText('bold', 'Resolved build configuration'));
  console.log(` - Build variant: ${styleText('blue', config.variant)}`);
  console.log(` - Library: ${styleText('blue', config.library)}`);
  console.log(` - Verbose: ${styleText('blue', String(config.verbose))}`);
  console.log(` - Dry run: ${styleText('blue', String(config.dryRun))}`);
  console.log(` - Tasks:`);
  config.tasks.forEach((task) => {
    console.log(`   - ${styleText('blue', task)}`);
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
      spawnAsync('./gradlew', [task], {
        cwd: path.join(process.cwd(), 'android'),
        stdio: verbose ? 'inherit' : 'pipe',
      }),
    loaderMessage: 'Running task: ' + task,
    successMessage: 'Running task: ' + task + ' succeeded',
    errorMessage: 'Running task: ' + task + ' failed',
    verbose,
  });
};
