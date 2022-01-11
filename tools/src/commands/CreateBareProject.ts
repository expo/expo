import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import spawnAsync from '@expo/spawn-async';
import path from 'path';

import * as ExpoCLI from '../ExpoCLI';
import Git from '../Git';
import { getExpoRepositoryRootDir } from '../Directories';
import { getListOfPackagesAsync, getPackageByName, Package } from '../Packages';

const EXCLUDED_PACKAGES = [
  'expo-module-template',

  // expo-yarn-workspaces/workspace-template
  'workspace-template',
  'first-package',
  'second-package',

  'unimodules-test-core',
];

type ActionOptions = {
  name: string;
  packages: string;
  workingDirectory: string;
  changedBase: string;
  changedRef: string;
};

async function action(options: ActionOptions) {
  if (!options.name) {
    throw new Error('Missing project name. Run with `--name <string>`.');
  }

  const extraPackages = await getExtraPackagesAsync(options);

  console.log('\u203A Creating project\n');
  const projectDir = await createBareProjectAsync(
    options.name,
    options.workingDirectory,
    extraPackages
  );

  process.chdir(projectDir);
  console.log('\u203A Installing packages\n');
  await spawnAsync('yarn', [], { stdio: 'inherit' });
}

export default (program: Command) => {
  program
    .command('create-bare-project')
    .alias('cbp')
    .description('Creates a new bare project from local template and packages.')
    .option('-n, --name <string>', 'Name of the project to create.', null)
    .option(
      '-p, --packages [string]',
      '[optional] Extra packages to install. May be `all`, `default`, `changed`, or a comma-separate list of package names.',
      'default'
    )
    .option(
      '-w, --working-directory [string]',
      'Working directory to create the project.',
      process.cwd()
    )
    .option('--changed-base <commit>', 'Git base for `-p changed` mode', 'master')
    .option('--changed-ref <commit>', 'Git ref for `-p changed` mode', 'HEAD')
    .asyncAction(action);
};

/**
 * This function will do `expo init` and setup package.json to have expo dependencies to local path.
 *
 * @param name project name
 * @param workDir working directory to create the project
 * @param extraPackages extra packages to install
 * @returns path to created project
 */
export async function createBareProjectAsync(
  name: string,
  workDir: string,
  extraPackages: string[]
): Promise<string> {
  const bareTemplateDir = path.join(
    getExpoRepositoryRootDir(),
    'templates',
    'expo-template-bare-minimum'
  );
  await ExpoCLI.runExpoCliAsync('init', [name, '-t', bareTemplateDir, '--no-install'], {
    cwd: workDir,
  });
  const projectPackageJsonPath = path.join(workDir, name, 'package.json');

  // Update package.json for packages installation
  const allPackages = await getListOfPackagesAsync();
  const allPackageMap = allPackages.reduce((accu, currValue) => {
    accu[currValue.packageName] = currValue;
    return accu;
  }, {});

  const projectPackageJson = require(projectPackageJsonPath);
  const installPackages: Set<Package> = new Set(
    [...Object.keys(projectPackageJson.dependencies), ...extraPackages]
      .filter((name) => allPackageMap[name])
      .map((name) => allPackageMap[name])
  );

  const projectDir = path.join(workDir, name);

  console.log('\u203A Packages to be installed\n');
  projectPackageJson.resolutions ??= {};
  for (const pkg of installPackages) {
    console.log(`- ${pkg.packageName}`);
    const relativePath = path.relative(projectDir, pkg.path);
    projectPackageJson.dependencies[pkg.packageName] = relativePath;
    // Also setup `resolutions` to local packages
    projectPackageJson.resolutions[pkg.packageName] = relativePath;
  }
  console.log('\n');
  await JsonFile.writeAsync(projectPackageJsonPath, projectPackageJson);
  return projectDir;
}

/**
 * Get transitive dependencies names from `expo` package.
 *
 * @returns expo's transitive packages
 */
function getExpoTransitivePackages(): string[] {
  const expoPackage = getPackageByName('expo');
  if (!expoPackage) {
    throw new Error('Cannot find the `expo` package.');
  }
  return expoPackage.getDependencies().map((dep) => dep.name);
}

/**
 * Get extra packages for installation.
 *
 * @param packages
 *   - 'default': to install default packages from bare templates and `expo`'s transitive packages
 *   - 'all': to install all supported packages
 *   - 'changed': to install changed packages from the current branch
 *   -'pkg-1, pkg-2': comma separated extra packages
 *
 * @returns extra packages
 */
async function getExtraPackagesAsync(options: ActionOptions): Promise<string[]> {
  const { packages } = options;
  const defaultPackages = getExpoTransitivePackages();

  let extraPackages: string[];
  if (packages === 'default') {
    extraPackages = [];
  } else if (packages === 'all') {
    const allPackages = await getListOfPackagesAsync();
    extraPackages = allPackages
      .map((pkg) => pkg.packageName)
      .filter((packageName) => packageName && !EXCLUDED_PACKAGES.includes(packageName));
  } else if (packages === 'changed') {
    extraPackages = await getChangedPackagesAsync(options.changedBase, options.changedRef);
  } else {
    extraPackages = packages.split(',').map((pkg) => pkg.trim());
  }

  return [...defaultPackages, ...extraPackages];
}

/**
 * Get changed packages between git merge base of master and HEAD
 */
async function getChangedPackagesAsync(base: string, ref: string): Promise<string[]> {
  const result: string[] = [];
  const rootDir = getExpoRepositoryRootDir();
  const allPackages = await getListOfPackagesAsync();
  const changedFiles = await Git.getChangedFilesAsync(base, ref);
  for (const file of changedFiles) {
    for (const pkg of allPackages) {
      const pkgRelativePath = path.relative(rootDir, pkg.path);
      const relativePath = path.relative(pkgRelativePath, file);
      // If changed file is located inside package path.
      if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        result.push(pkg.packageName);
      }
    }
  }
  return result;
}
