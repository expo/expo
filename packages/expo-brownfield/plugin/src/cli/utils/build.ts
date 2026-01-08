import ora, { type Ora } from 'ora';
import chalk from 'chalk';
import prompts from 'prompts';
import fs from 'node:fs/promises';
import path from 'node:path';
import { BuildConfigAndroid, BuildConfigIos, WithSpinnerParams } from './types';
import { runCommand } from './commands';
import { Errors } from '../constants';

const isBuildConfigAndroid = (
  config: BuildConfigAndroid | BuildConfigIos,
): config is BuildConfigAndroid => {
  return 'libraryName' in config;
};

export const printConfig = (config: BuildConfigAndroid | BuildConfigIos) => {
  console.log(chalk.bold('Build configuration:'));
  console.log(`- Verbose: ${config.verbose}`);

  if (isBuildConfigAndroid(config)) {
    console.log(
      `- Build type: ${config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1)}`,
    );
    console.log(`- Brownfield library: ${config.libraryName}`);
    console.log(
      `- Repositories: ${config.repositories.length > 0 ? config.repositories.join(', ') : '[]'}`,
    );
    console.log(
      `- Tasks: ${config.tasks.length > 0 ? config.tasks.join(', ') : '[]'}`,
    );
  } else {
    console.log(`- Artifacts directory: ${config.artifacts}`);
    console.log(
      `- Build type: ${config.buildType.charAt(0).toUpperCase() + config.buildType.slice(1)}`,
    );
    console.log(`- Xcode Scheme: ${config.scheme}`);
    console.log(`- Xcode Workspace: ${config.workspace}`);
  }

  console.log('');
};

export const withSpinner = async <T>({
  operation,
  loaderMessage,
  successMessage,
  errorMessage,
  onError = 'error',
  verbose = false,
}: WithSpinnerParams<T>) => {
  let spinner: Ora | undefined;

  try {
    if (!verbose) {
      spinner = ora(loaderMessage).start();
    }

    const result = await operation();

    if (!verbose) {
      spinner?.succeed(successMessage);
    }

    return result;
  } catch (error) {
    if (!verbose) {
      onError === 'error'
        ? spinner?.fail(errorMessage)
        : spinner?.warn(errorMessage);
    }

    return Errors.generic(error);
  } finally {
    if (!verbose && spinner?.isSpinning) {
      spinner?.stop();
    }
  }
};

export const checkPrebuild = async (
  platform: 'android' | 'ios',
): Promise<boolean> => {
  const nativeProjectPath = path.join(process.cwd(), platform);
  try {
    await fs.access(nativeProjectPath);
  } catch (error) {
    return false;
  }

  return true;
};

export const maybeRunPrebuild = async (platform: 'android' | 'ios') => {
  console.info(
    `${chalk.yellow('⚠')} Prebuild for platform: ${platform} is missing`,
  );
  const response = await prompts({
    type: 'confirm',
    name: 'shouldRunPrebuild',
    message: 'Do you want to run the prebuild now?',
    initial: false,
  });

  if (response.shouldRunPrebuild) {
    return withSpinner({
      operation: () =>
        runCommand('npx', ['expo', 'prebuild', '--platform', platform]),
      loaderMessage: `Running 'npx expo prebuild' for platform: ${platform}...`,
      successMessage: `Prebuild for ${platform} completed\n`,
      errorMessage: `Prebuild for ${platform} failed`,
      verbose: false,
    });
  } else {
    console.error(
      `${chalk.red('✖')} Brownfield cannot be built without prebuild`,
    );
    return process.exit(1);
  }
};

export const ensurePrebuild = async (platform: 'android' | 'ios') => {
  if (!(await checkPrebuild(platform))) {
    await maybeRunPrebuild(platform);
  }
};
