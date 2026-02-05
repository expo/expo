import chalk from 'chalk';
import path from 'path';

import { Args, Errors, Help } from '../../constants';
import {
  BuildTypeAndroid,
  ensurePrebuild,
  getAndroidConfig,
  getCommand,
  getCommonConfig,
  parseArgs,
  printConfig,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  const args = parseArgs({
    spec: Args.Android,
    // Skip first three args:
    // <node-path> expo-brownfield build:android
    argv: process.argv.slice(3),
    stopAtPositional: true,
  });

  if (getCommand(args)) {
    return Errors.additionalCommand('build:android');
  }

  // Only resolve --help and --verbose options
  const basicConfig = getCommonConfig(args);
  if (basicConfig.help) {
    console.log(Help.Android);
    return process.exit(0);
  }

  await ensurePrebuild('android');

  const config = await getAndroidConfig(args);
  printConfig(config);

  let tasks = [];
  if (config.tasks.length > 0) {
    tasks = config.tasks;
  } else if (config.repositories.length > 0) {
    for (const repository of config.repositories) {
      const task = constructTask(config.buildType, repository);
      tasks.push(task);
    }
  } else {
    console.warn(chalk.yellow('⚠  No tasks or repositories specified'));
    console.warn(chalk.yellow('Defaulting to repository: MavenLocal and configuration: All'));
    console.warn(chalk.yellow('This repository might not be available in your configuration\n'));
    tasks.push('publishBrownfieldAllPublicationToMavenLocal');
  }

  for (const task of tasks) {
    if (!config.dryRun) {
      await runTask(task, config.verbose);
    } else {
      console.log(`./gradlew ${task}`);
    }
  }
};

export default action;

const constructTask = (buildType: BuildTypeAndroid, repository: string): string => {
  const buildTypeCapitalized = buildType[0].toUpperCase() + buildType.slice(1);
  const repositorySuffixed = repository === 'MavenLocal' ? repository : `${repository}Repository`;
  return `publishBrownfield${buildTypeCapitalized}PublicationTo${repositorySuffixed}`;
};

const runTask = async (task: string, verbose: boolean) => {
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
