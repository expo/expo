import path from 'path';

import { Args, Help } from '../../constants';
import {
  BuildTypeAndroid,
  ensurePrebuild,
  getAndroidConfig,
  parseArgs,
  printConfig,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  const args = parseArgs({ spec: Args.Android, argv: process.argv.slice(2) });

  await ensurePrebuild('android');

  const config = await getAndroidConfig(args);
  if (config.help) {
    console.log(Help.Android);
    return process.exit(0);
  }

  printConfig(config);

  let tasks = [];
  if (config.tasks.length > 0) {
    tasks = config.tasks;
  } else {
    for (const repository of config.repositories) {
      const task = constructTask(config.buildType, repository);
      tasks.push(task);
    }
  }

  for (const task of tasks) {
    await runTask(task, config.verbose);
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
