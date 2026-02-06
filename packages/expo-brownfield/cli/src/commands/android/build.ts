import path from 'path';

import { Errors, Help } from '../../constants';
import {
  BuildTypeAndroid,
  ensurePrebuild,
  getAndroidConfig,
  getCommonConfig,
  printConfig,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  // const args = parseArgs({
  //   spec: Args.Android,
  //   // Skip first three args:
  //   // <node-path> expo-brownfield build:android
  //   argv: process.argv.slice(3),
  //   stopAtPositional: true,
  // });

  // if (getCommand(args)) {
  //   return Errors.additionalCommand('build:android');
  // }

  // // Only resolve --help and --verbose options
  // const basicConfig = getCommonConfig(args);
  // if (basicConfig.help) {
  //   console.log(Help.Android);
  //   return process.exit(0);
  // }

  // await ensurePrebuild('android');

  // const config = await getAndroidConfig(args);
  // printConfig(config);

  // let tasks = [];
  // if (config.tasks.length > 0) {
  //   tasks = config.tasks;
  // } else if (config.repositories.length > 0) {
  //   for (const repository of config.repositories) {
  //     const task = constructTask(config.buildType, repository);
  //     tasks.push(task);
  //   }
  // } else {
  //   Errors.missingTasksOrRepositories();
  // }

  // for (const task of tasks) {
  //   if (!config.dryRun) {
  //     await runTask(task, config.verbose);
  //   } else {
  //     console.log(`./gradlew ${task}`);
  //   }
  // }
  console.log('build:android');
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
