import { Command } from '@expo/commander';
import chalk from 'chalk';

import logger from '../Logger';
import checkPackageAsync from '../check-packages/checkPackageAsync';
import getPackagesToCheckAsync from '../check-packages/getPackagesToCheckAsync';
import { ActionOptions } from '../check-packages/types';

const { green, magenta, yellow } = chalk;

export default (program: Command) => {
  program
    .command('check-packages [packageNames...]')
    .alias('check', 'cp')
    .option(
      '-s, --since <commit>',
      'Reference to the commit since which you want to run incremental checks. Defaults to HEAD of the main branch.',
      'main'
    )
    .option('-a, --all', 'Whether to check all packages and ignore `--since` option.', false)
    .option('--no-build', 'Whether to skip `bun run build` check.', false)
    .option('--no-test', 'Whether to skip `bun run test` check.', false)
    .option('--no-lint', 'Whether to skip `bun run lint` check.', false)
    .option('--fix-lint', 'Whether to run `bun run lint --fix` instead of `bun run lint`.', false)
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
  const failedPackages: string[] = [];
  let passCount = 0;

  for (const pkg of packages) {
    if (await checkPackageAsync(pkg, options)) {
      passCount++;
    } else {
      failedPackages.push(pkg.packageName);
    }
    logger.log();
  }

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
