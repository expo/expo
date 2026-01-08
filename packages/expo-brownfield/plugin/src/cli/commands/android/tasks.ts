import path from 'node:path';
import chalk from 'chalk';
import { Args, Help } from '../../constants';
import {
  getTasksAndroidConfig,
  parseArgs,
  runCommand,
  withSpinner,
} from '../../utils';

const action = async () => {
  const args = parseArgs({
    spec: Args.TasksAndroid,
    argv: process.argv.slice(2),
  });
  const config = await getTasksAndroidConfig(args);

  if (config.help) {
    console.log(Help.TasksAndroid);
    return process.exit(0);
  }

  const { stdout } = await withSpinner({
    operation: () =>
      runCommand(
        './gradlew',
        [`${config.libraryName}:tasks`, '--group', 'publishing'],
        {
          cwd: path.join(process.cwd(), 'android'),
          verbose: config.verbose,
        },
      ),
    loaderMessage: 'Reading publish tasks from the android project...',
    successMessage:
      'Successfully read publish tasks from the android project\n',
    errorMessage: 'Failed to read publish tasks from the android project',
    verbose: config.verbose,
  });

  if (config.verbose) {
    // stdout is already printed to the console
    return;
  }

  const regex = /^publishBrownfield[a-zA-Z0-9_-]*/i;
  const publishTasks = stdout
    .split('\n')
    .map((line) => regex.exec(line)?.[0])
    // Remove duplicate maven local tasks
    .filter(
      (task) => task && !task.includes('MavenLocalRepository'),
    ) as string[];

  console.log(chalk.bold('Publish tasks:'));
  publishTasks.forEach((task) => {
    console.log(`- ${task}`);
  });

  const splitRegex =
    /^publishBrownfield(?:All|Debug|Release)PublicationTo(.+?)(?:Repository)?$/;
  const repositories = [
    ...new Set(
      publishTasks
        .map((task) => {
          return splitRegex.exec(task)?.[1];
        })
        .filter((repo) => repo),
    ),
  ];

  console.log(chalk.bold('\nRepositories:'));
  repositories.forEach((repo) => {
    console.log(`- ${repo}`);
  });
};

export default action;
