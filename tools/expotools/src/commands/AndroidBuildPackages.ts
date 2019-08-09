import fs from 'fs-extra';
import glob from 'glob-promise';
import inquirer from 'inquirer';
import path from 'path';
import spawnAsync from '@expo/spawn-async';

import * as Directories from '../Directories';

type ActionOptions = {
  sdkVersion: string;
  packages?: string;
}

type Package = {
  name: string;
  sourceDir: string;
  buildDir: string;
}

const EXPO_ROOT_DIR = Directories.getExpoRepositoryRootDir();

const REACT_ANDROID_PKG = {
  name: 'ReactAndroid',
  sourceDir: path.join(EXPO_ROOT_DIR, 'android', 'ReactAndroid'),
  buildDir: path.join(EXPO_ROOT_DIR, 'expokit-npm-package', 'maven', 'com', 'facebook', 'react'),
};
const EXPOVIEW_PKG = {
  name: 'expoview',
  sourceDir: path.join(EXPO_ROOT_DIR, 'android', 'expoview'),
  buildDir: path.join(EXPO_ROOT_DIR, 'expokit-npm-package', 'maven', 'host', 'exp', 'exponent', 'expoview'),
};

async function _findUnimodules(pkgDir: string): Promise<Package[]> {
  const unimodules: Package[] = [];

  const unimoduleJsonPaths = await glob(`${pkgDir}/**/unimodule.json`);
  for (const unimoduleJsonPath of unimoduleJsonPaths) {
    const unimodulePath = path.dirname(unimoduleJsonPath);
    const pkgJsonPath = path.join(unimodulePath, 'package.json');
    const buildGradlePath = path.join(unimodulePath, 'android', 'build.gradle');
    if ((await fs.pathExists(pkgJsonPath)) && (await fs.pathExists(buildGradlePath))) {
      const unimoduleJson = await fs.readJson(unimoduleJsonPath);
      const buildGradle = await fs.readFile(buildGradlePath, 'utf-8');

      const name = unimoduleJson.name;
      const group = buildGradle.match(/^group ?= ?'([\w.]+)'\n/m)[1];

      unimodules.push({
        name,
        sourceDir: path.join(unimodulePath, 'android'),
        buildDir: path.join(
          EXPO_ROOT_DIR,
          'expokit-npm-package',
          'maven',
          `${group.replace(/\./g, '/')}/${name}`
        ),
      });
    }
  }

  return unimodules;
}

async function _isPackageUpToDate(sourceDir: string, buildDir: string): Promise<boolean> {
  try {
    const sourceCommits = await _gitLogAsync(sourceDir);
    const buildCommits = await _gitLogAsync(buildDir);

    const latestSourceCommitSha = sourceCommits.lines[0].split(' ')[0];
    const latestBuildCommitSha = buildCommits.lines[0].split(' ')[0];

    // throws if source commit is not an ancestor of build commit
    await spawnAsync('git', [
      'merge-base',
      '--is-ancestor',
      latestSourceCommitSha,
      latestBuildCommitSha,
    ], {
      cwd: EXPO_ROOT_DIR,
    })
    return true;
  } catch (e) {
    return false;
  }
}

async function _gitLogAsync(path: string): Promise<{ lines: string[] }> {
  const child = await spawnAsync('git', [
    'log',
    `--pretty=oneline`,
    '--',
    path,
  ], {
    stdio: 'pipe',
    cwd: EXPO_ROOT_DIR,
  });

  return {
    lines: child.stdout.trim().split(/\r?\n/g).filter(a => a),
  };
}

async function _getSuggestedPackagesToBuild(packages: Package[]): Promise<string[]> {
  let packagesToBuild: string[] = [];
  for (const pkg of packages) {
    const isUpToDate = await _isPackageUpToDate(
      pkg.sourceDir,
      pkg.buildDir
    );
    if (!isUpToDate) {
      packagesToBuild.push(pkg.name);
    }
  }
  return packagesToBuild;
}

async function action(options: ActionOptions) {
  if (!options.sdkVersion) {
    throw new Error('Must run with `--sdkVersion SDK_VERSION`');
  }

  const detachableUniversalModules = await _findUnimodules(path.join(EXPO_ROOT_DIR, 'packages'));

  const packages: Package[] = [
    REACT_ANDROID_PKG,
    ...detachableUniversalModules,
    EXPOVIEW_PKG,
  ];
  let packagesToBuild: string[] = [];

  // TODO(eric): if sdkVersion does not match the one in build.gradle, rebuild all packages

  if (options.packages) {
    if (options.packages === 'all') {
      packagesToBuild = packages.map(pkg => pkg.name);
    } else if (options.packages === 'suggested') {
      console.log(' 🔍  Gathering data about packages...');
      packagesToBuild = await _getSuggestedPackagesToBuild(packages);
    } else {
      const packageNames = options.packages.split(',');
      packagesToBuild = packages.map(pkg => pkg.name).filter(pkgName => packageNames.includes(pkgName));
    }

    console.log(' 🛠  Rebuilding the following packages:');
    console.log(packagesToBuild);
  } else {
    // show prompts

    console.log(' 🔍  Gathering data...');

    packagesToBuild = await _getSuggestedPackagesToBuild(packages);

    console.log(' 🕵️  It appears that the following packages need to be rebuilt:');
    console.log(packagesToBuild);

    const { option } = await inquirer.prompt([{
      type: 'list',
      name: 'option',
      message: 'What would you like to do?',
      choices: [
        { value: 'suggested', name: 'Build the suggested packages only' },
        { value: 'all', name: 'Build all packages' },
        { value: 'choose', name: 'Choose packages manually' },
      ],
    }]);

    if (option === 'all') {
      packagesToBuild = packages.map(pkg => pkg.name);
    } else if (option === 'choose') {
      const result: any = await inquirer.prompt([{
        type: 'checkbox',
        name: 'packagesToBuild',
        message: 'Choose which packages to build',
        choices: packages.map(pkg => pkg.name),
        default: packagesToBuild,
        pageSize: Math.min(packages.length, (process.stdout.rows || 100) - 2),
      }]);
      packagesToBuild = result.packagesToBuild;
    }
  }
}

export default (program: any) => {
  program
    .command('android-build-packages')
    .alias('abp', 'update-exponent-view')
    .description('Builds all Android AAR packages for ExpoKit')
    .option('-s, --sdkVersion [string]', 'SDK version')
    .option('-p, --packages [string]', '[optional] packages to build. May be `all`, `suggested`, or a comma-separate list of package names.')
    .asyncAction(action);
};
