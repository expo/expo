import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import spawnAsync from '@expo/spawn-async';
import { Command } from 'commander/typings';

import { Directories } from '../expotools';

interface Package {
  path: string;
  name: string;
  scripts: { [key: string]: string };
}

const PACKAGES_DIR = Directories.getPackagesDir();

async function action(options) {
  const packages = await getListOfPackagesAsync();
  const only = options.only ? options.only.split(/\s*,\s*/g) : [];

  let passesCount = 0;
  let failsCount = 0;

  for (const pkg of packages) {
    if (only.length === 0 || only.includes(pkg.name)) {
      console.log(`Checking ${chalk.bold.green(pkg.name)} package ...`);

      try {
        if (options.build) {
          await runScriptAsync(pkg, 'build');
        }
        if (options.test) {
          await runScriptAsync(pkg, 'test', ['--watch', 'false', '--passWithNoTests']);
        }
        console.log();
        passesCount++;
      } catch (error) {
        failsCount++;
      }
    }
  }

  if (failsCount === 0) {
    console.log(chalk.bold.green(`All ${passesCount} packages passed.`));
    process.exit(0);
  } else {
    console.log(`${chalk.green(`${passesCount} packages passed`)}, ${chalk.magenta(`${failsCount} packages failed.`)}`);
    process.exit(1);
  }
}

function consoleErrorOutput(output: string, label: string, color: (string) => string): void {
  const lines = output.trim().split(/\n/g);
  console.error(lines.map(line => `${chalk.gray(label)} ${color(line)}`).join('\n'));
}

async function runScriptAsync(pkg: Package, scriptName: string, args: string[] = []): Promise<void> {
  if (!pkg.scripts[scriptName]) {
    // Package doesn't have such script.
    console.log(chalk.gray(`Script \`${chalk.cyan(scriptName)}\` not found`));
    return;
  }
  try {
    const spawnArgs = ['run', scriptName, ...args];

    console.log(`Running \`${chalk.cyan(`yarn ${spawnArgs.join(' ')}`)}\` ...`);

    await spawnAsync('yarn', spawnArgs, {
      stdio: 'pipe',
      cwd: pkg.path,
    });
  } catch (error) {
    console.error(chalk.bold.red(`Script \`${chalk.cyan(scriptName)}\` failed, see process output:`));
    consoleErrorOutput(error.stdout, 'stdout >', chalk.reset);
    consoleErrorOutput(error.stderr, 'stderr >', chalk.red);

    // rethrow error so we can count how many checks failed
    throw error;
  }
};

async function getListOfPackagesAsync(dir: string = PACKAGES_DIR, packages: Package[] = []): Promise<Package[]> {
  const dirs = await fs.readdir(dir);

  for (const dirName of dirs) {
    const packagePath = path.join(dir, dirName);

    try {
      const packageJson = require(path.join(packagePath, 'package.json'));
      const scripts = packageJson && packageJson.scripts || {};

      packages.push({
        path: packagePath,
        name: packageJson.name,
        scripts,
      });
    } catch (error) {
      // It might be a namespace. Recursively add packages under namespaced directory.
      if (dirName.startsWith('@')) {
        await getListOfPackagesAsync(packagePath, packages);
      }
    }
  }
  return packages;
}

export default (program: Command) => {
  program
    .command('check-packages')
    .option('--no-build', 'Whether to skip `yarn run build` check.', false)
    .option('--no-test', 'Whether to skip `yarn run test` check.', false)
    .option('-o, --only <package names>', 'Comma separated list of package names to check', '')
    .description('Checks if packages are building and their tests are passing.')
    .asyncAction(action);
};
