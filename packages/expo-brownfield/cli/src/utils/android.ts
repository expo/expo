import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

import CLIError from './error';
import { withSpinner } from './spinner';
import type { AndroidConfig, BuildVariant } from './types';

export const buildPublishingTask = (
  variant: BuildVariant,
  repository: string,
  fusedOpts: { fused: boolean; library: string } = { fused: false, library: '' }
): string => {
  const repositoryName = repository === 'MavenLocal' ? repository : `${repository}Repository`;
  const task = `publishBrownfield${variant}PublicationTo${repositoryName}`;
  // In `--fused` mode only the fused sibling subproject should publish — every other
  // expo module subproject also has this publication on its own setup plugin and would
  // publish redundant per-module AARs next to the fat AAR. The `:project:task` form
  // restricts Gradle to that one subproject. `-Pbrownfield.fused=true` (passed in
  // `runTask`) additionally short-circuits the publish plugin's prebuilts re-publish loop.
  if (fusedOpts.fused) {
    return `:${fusedOpts.library}-fused:${task}`;
  }
  return task;
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

export const runTask = async (
  task: string,
  verbose: boolean,
  dryRun: boolean,
  extraGradleArgs: string[] = []
) => {
  const args = [task, ...extraGradleArgs];
  if (dryRun) {
    console.log(`./gradlew ${args.join(' ')}`);
    return;
  }

  return withSpinner({
    operation: () =>
      spawnAsync('./gradlew', args, {
        cwd: path.join(process.cwd(), 'android'),
        stdio: verbose ? 'inherit' : 'pipe',
      }),
    loaderMessage: 'Running task: ' + task,
    successMessage: 'Running task: ' + task + ' succeeded',
    errorMessage: 'Running task: ' + task + ' failed',
    verbose,
  });
};
