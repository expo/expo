import { Command } from '@expo/commander';

import logger from '../Logger';
import { runTurboTasksAsync } from '../Turbo';

type CheckOptions = {
  since: string;
  all: boolean;
  core: boolean;
  test: boolean;
  lint: boolean;
  fixLint: boolean;
  dependencyCheck: boolean;
};

const CORE_PACKAGES = ['expo', 'expo-modules-core'];

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
    .option('-c, --core', 'Whether to always check core packages (expo, expo-modules-core).', false)
    .option('--no-test', 'Whether to skip the `test` task.', false)
    .option('--no-lint', 'Whether to skip the `lint` task.', false)
    .option('--fix-lint', 'Whether to run `lint` with `--fix`.', false)
    .option('--no-dependency-check', 'Whether to skip the `depscheck` task.', false)
    .description('Checks if packages build successfully and their tests pass (via Turborepo).')
    .asyncAction(main);
};

async function main(packageNames: string[], options: CheckOptions): Promise<void> {
  // `build` regenerates the committed build output, so it always runs.
  const tasks = ['build', 'typecheck'];
  if (options.dependencyCheck) {
    tasks.push('depscheck');
  }
  if (options.test) {
    tasks.push('test');
  }
  if (options.lint && !options.fixLint) {
    tasks.push('lint');
  }

  let filters: string[];
  let affected = false;
  let scmBase: string | undefined;
  if (options.all) {
    filters = ['./packages/**'];
  } else if (packageNames.length > 0) {
    filters = [...packageNames];
  } else {
    filters = ['./packages/**'];
    affected = true;
    scmBase = options.since;
  }

  if (options.core && !affected) {
    filters.push(...CORE_PACKAGES);
  }

  try {
    await runTurboTasksAsync(tasks, { filters, affected, scmBase, continueOnError: true });

    // `--affected` gates explicit filters, so core packages need their own batch to run unconditionally.
    if (options.core && affected) {
      await runTurboTasksAsync(tasks, { filters: CORE_PACKAGES, continueOnError: true });
    }

    // Run lint alone so `--fix` is not forwarded to the other tasks.
    if (options.lint && options.fixLint) {
      await runTurboTasksAsync(['lint'], {
        filters,
        affected,
        scmBase,
        passthroughArgs: ['--fix'],
      });
    }
  } catch (error: any) {
    // Turbo already printed the failure; exit without a stack trace.
    logger.error('🛑 One or more package checks failed. See the output above.');
    process.exit(error.status ?? 1);
  }

  logger.success('🏁 All checks passed.');
}
