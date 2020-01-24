import path from 'path';
import chalk from 'chalk';
import spawnAsync from '@expo/spawn-async';
import { Command } from '@expo/commander';

import { Package, getListOfPackagesAsync } from '../Packages';
import * as Directories from '../Directories';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function action(options) {
  const packages = await getListOfPackagesAsync();
  const only = options.only ? options.only.split(/\s*,\s*/g) : [];
  const failedPackages: string[] = [];

  let passCount = 0;

  for (const pkg of packages) {
    if (!pkg.scripts.build && !pkg.scripts.test) {
      // If the package doesn't have build or test script, just skip it.
      continue;
    }
    if (only.length > 0 && !only.includes(pkg.packageName)) {
      continue;
    }
    console.log(`🔍 Checking the ${chalk.bold.green(pkg.packageName)} package ...`);

    try {
      if (options.build) {
        await runScriptAsync(pkg, 'clean');
        await runScriptAsync(pkg, 'build');

        if (options.uniformityCheck) {
          await checkBuildUniformityAsync(pkg);
        }
      }
      if (options.test) {
        const args = ['--watch', 'false', '--passWithNoTests'];

        if (process.env.CI) {
          // Limit to one worker on CIs
          args.push('--maxWorkers', '1');
        }
        await runScriptAsync(pkg, 'test', args);
      }
      if (options.lint) {
        const args = ['--max-warnings', '0'];
        if (options.fixLint) {
          args.push('--fix');
        }
        await runScriptAsync(pkg, 'lint', args);
      }
      console.log(`✨ ${chalk.bold.green(pkg.packageName)} checks passed.`);
      passCount++;
    } catch (error) {
      failedPackages.push(pkg.packageName);
    }
    console.log();
  }

  const failureCount = failedPackages.length;

  if (failureCount === 0) {
    console.log(chalk.bold.green(`🏁 All ${passCount} packages passed.`));
    process.exit(0);
  } else {
    console.log(
      `${chalk.green(`🏁 ${passCount} packages passed`)},`,
      `${chalk.magenta(`${failureCount} ${failureCount === 1 ? 'package' : 'packages'} failed:`)}`,
      failedPackages.map(failedPackage => chalk.yellow(failedPackage)).join(', ')
    );
    process.exit(1);
  }
}

function consoleErrorOutput(output: string, label: string, color: (string) => string): void {
  const lines = output.trim().split(/\r\n?|\n/g);
  console.error(lines.map(line => `${chalk.gray(label)} ${color(line)}`).join('\n'));
}

async function runScriptAsync(
  pkg: Package,
  scriptName: string,
  args: string[] = []
): Promise<void> {
  if (!pkg.scripts[scriptName]) {
    // Package doesn't have such script.
    console.log(chalk.gray(`🤷‍♂️ Script \`${chalk.cyan(scriptName)}\` not found`));
    return;
  }
  const spawnArgs = [scriptName, ...args];

  console.log(`🏃‍♀️ Running \`${chalk.cyan(`yarn ${spawnArgs.join(' ')}`)}\` ...`);

  try {
    await spawnAsync('yarn', spawnArgs, {
      stdio: 'pipe',
      cwd: pkg.path,
    });
  } catch (error) {
    console.error(
      chalk.bold.red(`Script \`${chalk.cyan(scriptName)}\` failed, see process output:`)
    );
    consoleErrorOutput(error.stdout, 'stdout >', chalk.reset);
    consoleErrorOutput(error.stderr, 'stderr >', chalk.red);

    // rethrow error so we can count how many checks failed
    throw error;
  }
}

/**
 * Checks whether the state of build files is the same after running build script.
 * @param pkg Package to check
 */
async function checkBuildUniformityAsync(pkg: Package): Promise<void> {
  const child = await spawnAsync('git', ['status', '--porcelain', './build'], {
    stdio: 'pipe',
    cwd: pkg.path,
  });
  const lines = child.stdout ? child.stdout.trim().split(/\r\n?|\n/g) : [];

  if (lines.length > 0) {
    console.error(chalk.bold.red(`The following build files need to be rebuilt and committed:`));
    lines.map(line => {
      const filePath = path.join(EXPO_DIR, line.replace(/^\s*\S+\s*/g, ''));
      console.error(chalk.yellow(path.relative(pkg.path, filePath)));
    });

    throw new Error(
      `The build folder for ${pkg.packageName} has uncommitted changes after building.`
    );
  }
}

export default (program: Command) => {
  program
    .command('check-packages')
    .option('--no-build', 'Whether to skip `yarn build` check.', false)
    .option('--no-test', 'Whether to skip `yarn test` check.', false)
    .option('--no-lint', 'Whether to skip `yarn lint` check.', false)
    .option('--fix-lint', 'Whether to run `yarn lint --fix` instead of `yarn lint`.', false)
    .option(
      '--no-uniformity-check',
      'Whether to check the uniformity of committed and generated build files.',
      false
    )
    .option('-o, --only <package names>', 'Comma-separated list of package names to check.', '')
    .description('Checks if packages build successfully and their tests pass.')
    .asyncAction(action);
};
