import fs from 'fs-extra';
import glob from 'glob-promise';
import inquirer from 'inquirer';
import path from 'path';
import readline from 'readline';
import spawnAsync from '@expo/spawn-async';

import * as Directories from '../Directories';

type ActionOptions = {
  sdkVersion: string;
  packages?: string;
}

type Package = {
  name: string;
  sourceDir: string;
  buildDirRelative: string;
}

const EXPO_ROOT_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getAndroidDir();

const REACT_ANDROID_PKG = {
  name: 'ReactAndroid',
  sourceDir: path.join(ANDROID_DIR, 'ReactAndroid'),
  buildDirRelative: path.join('com', 'facebook', 'react'),
};
const EXPOVIEW_PKG = {
  name: 'expoview',
  sourceDir: path.join(ANDROID_DIR, 'expoview'),
  buildDirRelative: path.join('host', 'exp', 'exponent', 'expoview'),
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
        buildDirRelative: `${group.replace(/\./g, '/')}/${name}`,
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
      path.join(EXPO_ROOT_DIR, 'expokit-npm-package', 'maven', pkg.buildDirRelative)
    );
    if (!isUpToDate) {
      packagesToBuild.push(pkg.name);
    }
  }
  return packagesToBuild;
}

async function _regexFileAsync(filename: string, regex: RegExp | string, replace: string): Promise<void> {
  let file = await fs.readFile(filename);
  let fileString = file.toString();
  await fs.writeFile(filename, fileString.replace(regex, replace));
}

let savedFiles = {};
async function _stashFilesAsync(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    let file = await fs.readFile(filename);
    savedFiles[filename] = file.toString();
  }
}

async function _restoreFilesAsync(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await fs.writeFile(filename, savedFiles[filename]);
  }
}

async function _commentWhenDistributing(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await _regexFileAsync(
      filename,
      `// WHEN_DISTRIBUTING_REMOVE_FROM_HERE`,
      '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE'
    );
    await _regexFileAsync(
      filename,
      `// WHEN_DISTRIBUTING_REMOVE_TO_HERE`,
      'WHEN_DISTRIBUTING_REMOVE_TO_HERE */'
    );
  }
}

async function _uncommentWhenDistributing(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await _regexFileAsync(filename, '/* UNCOMMENT WHEN DISTRIBUTING', '');
    await _regexFileAsync(filename, 'END UNCOMMENT WHEN DISTRIBUTING */', '');
  }
}

async function _updateExpoViewAsync(packages: Package[], sdkVersion: string): Promise<void> {
  let appBuildGradle = path.join(ANDROID_DIR, 'app', 'build.gradle');
  let expoViewBuildGradle = path.join(ANDROID_DIR, 'expoview', 'build.gradle');
  const settingsGradle = path.join(ANDROID_DIR, 'settings.gradle');
  const constantsJava = path.join(
    ANDROID_DIR,
    'expoview/src/main/java/host/exp/exponent/Constants.java'
  );
  const multipleVersionReactNativeActivity = path.join(
    ANDROID_DIR,
    'expoview/src/main/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java'
  );

  // Modify permanently
  await _regexFileAsync(expoViewBuildGradle, /version = '[\d.]+'/, `version = '${sdkVersion}'`);
  await _regexFileAsync(
    expoViewBuildGradle,
    /api 'com.facebook.react:react-native:[\d.]+'/,
    `api 'com.facebook.react:react-native:${sdkVersion}'`
  );
  await _regexFileAsync(
    path.join(ANDROID_DIR, 'ReactAndroid', 'release.gradle'),
    /version = '[\d.]+'/,
    `version = '${sdkVersion}'`
  );
  await _regexFileAsync(
    path.join(ANDROID_DIR, 'app', 'build.gradle'),
    /host.exp.exponent:expoview:[\d.]+/,
    `host.exp.exponent:expoview:${sdkVersion}`
  );

  const filesToStash = [
    appBuildGradle,
    expoViewBuildGradle,
    multipleVersionReactNativeActivity,
    constantsJava,
    settingsGradle,
  ];
  await _stashFilesAsync(filesToStash);

  // Modify temporarily
  await _regexFileAsync(
    constantsJava,
    /TEMPORARY_ABI_VERSION\s*=\s*null/,
    `TEMPORARY_ABI_VERSION = "${sdkVersion}"`
  );
  await _regexFileAsync(
    settingsGradle,
    `// FLAG_BEGIN_REMOVE__UPDATE_EXPOKIT`,
    `/*`
  );
  await _regexFileAsync(
    settingsGradle,
    `// FLAG_END_REMOVE__UPDATE_EXPOKIT`,
    `*/ //`
  );
  await _uncommentWhenDistributing([appBuildGradle, expoViewBuildGradle]);
  await _commentWhenDistributing([constantsJava, expoViewBuildGradle, multipleVersionReactNativeActivity]);

  // Clear maven local so that we don't end up with multiple versions
  console.log(' ❌  Clearing old package versions...')

  await spawnAsync('rm', [
    '-rf',
    ...packages.map(pkg => path.join(process.env.HOME!, '.m2', 'repository', pkg.buildDirRelative)),
    ...packages.map(pkg => path.join(ANDROID_DIR, 'maven', pkg.buildDirRelative)),
    ...packages.map(pkg => path.join(pkg.sourceDir, 'build'))
  ]);

  for (const pkg of packages) {
    process.stdout.write(` 🛠   Building ${pkg.name}...`);
    await spawnAsync('./gradlew', [`:${pkg.name}:uploadArchives`], {
      cwd: ANDROID_DIR,
    });
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(` ✅  Finished building ${pkg.name}\n`);
  }

  await _restoreFilesAsync(filesToStash);

  console.log(' 🚚  Copying newly built packages...');

  await spawnAsync('mkdir', ['-p', path.join(ANDROID_DIR, 'maven/com/facebook')])
  await spawnAsync('mkdir', ['-p', path.join(ANDROID_DIR, 'maven/host/exp/exponent')]);
  await spawnAsync('mkdir', ['-p', path.join(ANDROID_DIR, 'maven/org/unimodules')]);

  for (const pkg of packages) {
    await spawnAsync('cp', [
      '-r',
      path.join(process.env.HOME!, '.m2', 'repository', pkg.buildDirRelative),
      path.join(ANDROID_DIR, 'maven', pkg.buildDirRelative),
    ]);
  }

  // Copy JSC
  await spawnAsync('rm', ['-rf', path.join(ANDROID_DIR, 'maven/org/webkit/')]);
  await spawnAsync('cp', [
    '-r',
    path.join(ANDROID_DIR, '../node_modules/jsc-android/dist/org/webkit'),
    path.join(ANDROID_DIR, 'maven/org/webkit/'),
  ]);
}

async function action(options: ActionOptions) {
  if (!options.sdkVersion) {
    throw new Error('Must run with `--sdkVersion SDK_VERSION`');
  }

  const detachableUniversalModules = await _findUnimodules(path.join(EXPO_ROOT_DIR, 'packages'));

  // packages must stay in this order --
  // expoview MUST be last
  const packages: Package[] = [
    REACT_ANDROID_PKG,
    ...detachableUniversalModules,
    EXPOVIEW_PKG,
  ];
  let packagesToBuild: string[] = [];

  const expoviewBuildGradle = await fs.readFile(
    path.join(ANDROID_DIR, 'expoview', 'build.gradle'),
  );
  const match = expoviewBuildGradle.toString().match(/api 'com.facebook.react:react-native:([\d.]+)'/);
  if (!match[1]) {
    throw new Error('Could not find SDK version in android/expoview/build.gradle: unexpected format');
  }

  if (match[1] !== options.sdkVersion) {
    console.log(" 🔍  It looks like you're adding a new SDK version. Ignoring the `--packages` option and rebuilding all packages...");
    packagesToBuild = packages.map(pkg => pkg.name);
  } else if (options.packages) {
    if (options.packages === 'all') {
      packagesToBuild = packages.map(pkg => pkg.name);
    } else if (options.packages === 'suggested') {
      console.log(' 🔍  Gathering data about packages...');
      packagesToBuild = await _getSuggestedPackagesToBuild(packages);
    } else {
      const packageNames = options.packages.split(',');
      packagesToBuild = packages.map(pkg => pkg.name).filter(pkgName => packageNames.includes(pkgName));
    }
    console.log(' 🛠   Rebuilding the following packages:');
    console.log(packagesToBuild);
  } else {
    // gather suggested package data and then show prompts
    console.log(' 🔍  Gathering data...');

    packagesToBuild = await _getSuggestedPackagesToBuild(packages);

    console.log(' 🕵️   It appears that the following packages need to be rebuilt:');
    console.log(packagesToBuild);

    const { option } = await inquirer.prompt<{ option: string }>([{
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
      const result = await inquirer.prompt<{ packagesToBuild: string[] }>([{
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

  await _updateExpoViewAsync(packages.filter(pkg => packagesToBuild.includes(pkg.name)), options.sdkVersion);
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
