import chalk from 'chalk';
import { Command } from '@expo/commander';

import logger from '../Logger';
import getPackagesToCheckAsync from '../check-packages/getPackagesToCheckAsync';
import checkPackageAsync from '../check-packages/checkPackageAsync';
import { ActionOptions } from '../check-packages/types';
import { performance } from 'perf_hooks';
import { type } from 'os';

const { green, magenta, yellow } = chalk;

export default (program: Command) => {
  program
    .command('check-packages [packageNames...]')
    .alias('check', 'cp')
    .option(
      '-s, --since <commit>',
      'Reference to the commit since which you want to run incremental checks. Defaults to HEAD of the master branch.',
      'master'
    )
    .option('-a, --all', 'Whether to check all packages and ignore `--since` option.', false)
    .option('--no-build', 'Whether to skip `yarn build` check.', false)
    .option('--no-test', 'Whether to skip `yarn test` check.', false)
    .option('--no-lint', 'Whether to skip `yarn lint` check.', false)
    .option('--fix-lint', 'Whether to run `yarn lint --fix` instead of `yarn lint`.', false)
    .option(
      '--no-uniformity-check',
      'Whether to check the uniformity of committed and generated build files.',
      false
    )
    .description('Checks if packages build successfully and their tests pass.')
    .asyncAction(main);
};

async function main(packageNames: string[], options: ActionOptions): Promise<void> {
  options.packageNames = packageNames;

  const packages = await getPackagesToCheckAsync(options);
  type PP = { packageName: string; timeInMs: number };

  const packagesPerformance: PP[] = [];
  const failedPackages: string[] = [];
  let passCount = 0;

  for (const pkg of packages) {
    let startTime = performance.now();
    if (await checkPackageAsync(pkg, options)) {
      passCount++;
    } else {
      failedPackages.push(pkg.packageName);
    }
    if (!pkg.hasPlugin) {
      packagesPerformance.push({
        packageName: pkg.packageName,
        timeInMs: performance.now() - startTime,
      });
    }
    logger.log();
  }

  packagesPerformance.sort((a: PP, b: PP) => {
    return a.timeInMs - b.timeInMs;
  });

  packagesPerformance.forEach((pp) => {
    console.log(pp.packageName + ': ' + pp.timeInMs);
  });

  const failureCount = failedPackages.length;

  if (failureCount !== 0) {
    logger.log(
      `${green(`🏁 ${passCount} packages passed`)},`,
      `${magenta(`${failureCount} ${failureCount === 1 ? 'package' : 'packages'} failed:`)}`,
      failedPackages.map((failedPackage) => yellow(failedPackage)).join(', ')
    );
    process.exit(1);
    return;
  }
  logger.success('🏁 All packages passed.');
}
