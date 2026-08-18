import chalk from 'chalk';
import inquirer from 'inquirer';

import { androidNativeUnitTests } from './AndroidNativeUnitTests';
import { iosNativeUnitTests } from './IosNativeUnitTests';

type PlatformName = 'android' | 'ios' | 'both';
type TestType = 'local' | 'instrumented';

async function thisAction({
  platform,
  type = 'local',
  packages,
  affected,
  since,
}: {
  platform?: PlatformName;
  type: TestType;
  packages?: string;
  affected?: boolean;
  since?: string;
}) {
  if (!platform) {
    console.log(chalk.yellow("You haven't specified platform to run unit tests for!"));
    const result = await inquirer.prompt<{ platform: PlatformName }>([
      {
        name: 'platform',
        type: 'list',
        message: 'Which platform do you want to run native tests ?',
        choices: ['android', 'ios', 'both'],
        default: 'android',
      },
    ]);
    platform = result.platform;
  }
  const runAndroid = platform === 'android' || platform === 'both';
  const runIos = platform === 'ios' || platform === 'both';
  if (runIos) {
    await iosNativeUnitTests({ packages, affected, since });
  }
  if (runAndroid) {
    await androidNativeUnitTests({ type, packages });
  }
}

export default (program: any) => {
  program
    .command('native-unit-tests')
    .option(
      '-p, --platform <string>',
      'Determine for which platform we should run native tests: android, ios or both'
    )
    .option(
      '-t, --type <string>',
      'Type of unit test to run, if supported by this platform. local (default) or instrumented'
    )
    .option(
      '--packages <string>',
      '[optional] Comma-separated list of package names to run unit tests for. Defaults to all packages with unit tests.'
    )
    .option(
      '--affected',
      '[optional] Only test packages affected by changes since `--since`, including their dependents. iOS only for now. Ignored when `--packages` is passed.',
      false
    )
    .option(
      '-s, --since <ref>',
      '[optional] Git ref to diff against for `--affected`. Defaults to `main`.',
      'main'
    )
    .description('Runs native unit tests for each unimodules that provides them.')
    .asyncAction(thisAction);
};
