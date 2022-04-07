import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import readline from 'readline';

import * as Directories from '../Directories';
import * as Packages from '../Packages';
import * as ProjectVersions from '../ProjectVersions';

type ActionOptions = {
  sdkVersion: string;
  packages?: string;
};

type Package = {
  name: string;
  sourceDir: string;
  buildDirRelative: string;
};

// There are a few packages that we want to exclude from shell app builds; they don't follow any
// easy pattern so we just keep track of them manually here.
export const EXCLUDED_PACKAGE_SLUGS = [
  'expo-dev-client',
  'expo-dev-launcher',
  'expo-dev-menu',
  'expo-dev-menu-interface',
  'expo-module-template',
  'expo-modules-test-core',
  'unimodules-core',
  'unimodules-react-native-adapter',
];

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

  const packages = await Packages.getListOfPackagesAsync();
  for (const pkg of packages) {
    if (!pkg.isSupportedOnPlatform('android') || !pkg.androidPackageName) continue;
    unimodules.push({
      name: pkg.packageSlug,
      sourceDir: path.join(pkg.path, pkg.androidSubdirectory),
      buildDirRelative: `${pkg.androidPackageName.replace(/\./g, '/')}/${pkg.packageSlug}`,
    });
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
    await spawnAsync(
      'git',
      ['merge-base', '--is-ancestor', latestSourceCommitSha, latestBuildCommitSha],
      {
        cwd: EXPO_ROOT_DIR,
      }
    );
    return true;
  } catch (e) {
    return false;
  }
}

async function _gitLogAsync(path: string): Promise<{ lines: string[] }> {
  const child = await spawnAsync('git', ['log', `--pretty=oneline`, '--', path], {
    stdio: 'pipe',
    cwd: EXPO_ROOT_DIR,
  });

  return {
    lines: child.stdout
      .trim()
      .split(/\r?\n/g)
      .filter((a) => a),
  };
}

async function _getSuggestedPackagesToBuild(packages: Package[]): Promise<string[]> {
  let packagesToBuild: string[] = [];
  for (const pkg of packages) {
    const isUpToDate = await _isPackageUpToDate(
      pkg.sourceDir,
      path.join(EXPO_ROOT_DIR, 'android', 'maven', pkg.buildDirRelative)
    );
    if (!isUpToDate) {
      packagesToBuild.push(pkg.name);
    }
  }
  return packagesToBuild;
}

async function _regexFileAsync(
  filename: string,
  regex: RegExp | string,
  replace: string
): Promise<void> {
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

async function _restoreFilesAsync(): Promise<void> {
  for (const filename in savedFiles) {
    await fs.writeFile(filename, savedFiles[filename]);
    delete savedFiles[filename];
  }
}

async function _commentWhenDistributing(filenames: string[]): Promise<void> {
  for (const filename of filenames) {
    await _regexFileAsync(
      filename,
      /\/\/ WHEN_DISTRIBUTING_REMOVE_FROM_HERE/g,
      '/* WHEN_DISTRIBUTING_REMOVE_FROM_HERE'
    );
    await _regexFileAsync(
      filename,
      /\/\ WHEN_DISTRIBUTING_REMOVE_TO_HERE/g,
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

async function _updateExpoViewAsync(packages: Package[], sdkVersion: string): Promise<number> {
  let appBuildGradle = path.join(ANDROID_DIR, 'app', 'build.gradle');
  let rootBuildGradle = path.join(ANDROID_DIR, 'build.gradle');
  let expoViewBuildGradle = path.join(ANDROID_DIR, 'expoview', 'build.gradle');
  const settingsGradle = path.join(ANDROID_DIR, 'settings.gradle');
  const constantsJava = path.join(
    ANDROID_DIR,
    'expoview/src/main/java/host/exp/exponent/Constants.java'
  );
  const multipleVersionReactNativeActivity = path.join(
    ANDROID_DIR,
    'expoview/src/versioned/java/host/exp/exponent/experience/MultipleVersionReactNativeActivity.java'
  );

  // Modify permanently
  await _regexFileAsync(expoViewBuildGradle, /version = '[\d.]+'/, `version = '${sdkVersion}'`);
  await _regexFileAsync(
    expoViewBuildGradle,
    /api 'com.facebook.react:react-native:[\d.]+'/,
    `api 'com.facebook.react:react-native:${sdkVersion}'`
  );
  await _regexFileAsync(
    path.join(ANDROID_DIR, 'ReactAndroid', 'build.gradle'),
    /version = '[\d.]+'/,
    `version = '${sdkVersion}'`
  );
  await _regexFileAsync(
    path.join(ANDROID_DIR, 'app', 'build.gradle'),
    /host.exp.exponent:expoview:[\d.]+/,
    `host.exp.exponent:expoview:${sdkVersion}`
  );

  await _stashFilesAsync([
    appBuildGradle,
    rootBuildGradle,
    expoViewBuildGradle,
    multipleVersionReactNativeActivity,
    constantsJava,
    settingsGradle,
  ]);

  // Modify temporarily
  await _regexFileAsync(
    constantsJava,
    /TEMPORARY_ABI_VERSION\s*=\s*null/,
    `TEMPORARY_ABI_VERSION = "${sdkVersion}"`
  );
  await _uncommentWhenDistributing([appBuildGradle, expoViewBuildGradle]);
  await _commentWhenDistributing([
    constantsJava,
    rootBuildGradle,
    expoViewBuildGradle,
    multipleVersionReactNativeActivity,
  ]);

  // Clear maven local so that we don't end up with multiple versions
  console.log(' ❌  Clearing old package versions...');

  for (const pkg of packages) {
    await fs.remove(path.join(process.env.HOME!, '.m2', 'repository', pkg.buildDirRelative));
    await fs.remove(path.join(ANDROID_DIR, 'maven', pkg.buildDirRelative));
    await fs.remove(path.join(pkg.sourceDir, 'build'));
  }

  // hacky workaround for weird issue where some packages need to be built twice after cleaning
  // in order to have .so libs included in the aar
  const reactAndroidIndex = packages.findIndex((pkg) => pkg.name === REACT_ANDROID_PKG.name);
  if (reactAndroidIndex > -1) {
    packages.splice(reactAndroidIndex, 0, REACT_ANDROID_PKG);
  }
  const expoviewIndex = packages.findIndex((pkg) => pkg.name === EXPOVIEW_PKG.name);
  if (expoviewIndex > -1) {
    packages.splice(expoviewIndex, 0, EXPOVIEW_PKG);
  }

  let failedPackages: string[] = [];
  for (const pkg of packages) {
    process.stdout.write(` 🛠   Building ${pkg.name}...`);
    try {
      await spawnAsync('./gradlew', [`:${pkg.name}:publish`], {
        cwd: ANDROID_DIR,
      });
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(` ✅  Finished building ${pkg.name}\n`);
    } catch (e) {
      if (
        e.status === 130 ||
        e.signal === 'SIGINT' ||
        e.status === 137 ||
        e.signal === 'SIGKILL' ||
        e.status === 143 ||
        e.signal === 'SIGTERM'
      ) {
        throw e;
      } else {
        failedPackages.push(pkg.name);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(` ❌  Failed to build ${pkg.name}:\n`);
        console.error(chalk.red(e.message));
        console.error(chalk.red(e.stderr));
      }
    }
  }

  await _restoreFilesAsync();

  console.log(' 🚚  Copying newly built packages...');

  await fs.mkdirs(path.join(ANDROID_DIR, 'maven/com/facebook'));
  await fs.mkdirs(path.join(ANDROID_DIR, 'maven/host/exp/exponent'));
  await fs.mkdirs(path.join(ANDROID_DIR, 'maven/org/unimodules'));

  for (const pkg of packages) {
    if (failedPackages.includes(pkg.name)) {
      continue;
    }
    await fs.copy(
      path.join(process.env.HOME!, '.m2', 'repository', pkg.buildDirRelative),
      path.join(ANDROID_DIR, 'maven', pkg.buildDirRelative)
    );
  }

  if (failedPackages.length) {
    console.log(' ❌  The following packages failed to build:');
    console.log(failedPackages);
    console.log(
      `You will need to fix the compilation errors show in the logs above and then run \`et abp -s ${sdkVersion} -p ${failedPackages.join(
        ','
      )}\``
    );
  }

  return failedPackages.length;
}

async function action(options: ActionOptions) {
  process.on('SIGINT', _exitHandler);
  process.on('SIGTERM', _exitHandler);

  const detachableUniversalModules = (
    await _findUnimodules(path.join(EXPO_ROOT_DIR, 'packages'))
  ).filter((unimodule) => !EXCLUDED_PACKAGE_SLUGS.includes(unimodule.name));

  // packages must stay in this order --
  // ReactAndroid MUST be first and expoview MUST be last
  const packages: Package[] = [REACT_ANDROID_PKG, ...detachableUniversalModules, EXPOVIEW_PKG];
  let packagesToBuild: string[] = [];

  const expoviewBuildGradle = await fs.readFile(path.join(ANDROID_DIR, 'expoview', 'build.gradle'));
  const match = expoviewBuildGradle
    .toString()
    .match(/api 'com.facebook.react:react-native:([\d.]+)'/);
  if (!match || !match[1]) {
    throw new Error(
      'Could not find SDK version in android/expoview/build.gradle: unexpected format'
    );
  }

  if (match[1] !== options.sdkVersion) {
    console.log(
      " 🔍  It looks like you're adding a new SDK version. Ignoring the `--packages` option and rebuilding all packages..."
    );
    packagesToBuild = packages.map((pkg) => pkg.name);
  } else if (options.packages) {
    if (options.packages === 'all') {
      packagesToBuild = packages.map((pkg) => pkg.name);
    } else if (options.packages === 'suggested') {
      console.log(' 🔍  Gathering data about packages...');
      packagesToBuild = await _getSuggestedPackagesToBuild(packages);
    } else {
      const packageNames = options.packages.split(',');
      packagesToBuild = packages
        .map((pkg) => pkg.name)
        .filter((pkgName) => packageNames.includes(pkgName));
    }
    console.log(' 🛠   Rebuilding the following packages:');
    console.log(packagesToBuild);
  } else {
    // gather suggested package data and then show prompts
    console.log(' 🔍  Gathering data...');

    packagesToBuild = await _getSuggestedPackagesToBuild(packages);

    console.log(' 🕵️   It appears that the following packages need to be rebuilt:');
    console.log(packagesToBuild);

    const { option } = await inquirer.prompt<{ option: string }>([
      {
        type: 'list',
        name: 'option',
        message: 'What would you like to do?',
        choices: [
          { value: 'suggested', name: 'Build the suggested packages only' },
          { value: 'all', name: 'Build all packages' },
          { value: 'choose', name: 'Choose packages manually' },
        ],
      },
    ]);

    if (option === 'all') {
      packagesToBuild = packages.map((pkg) => pkg.name);
    } else if (option === 'choose') {
      const result = await inquirer.prompt<{ packagesToBuild: string[] }>([
        {
          type: 'checkbox',
          name: 'packagesToBuild',
          message: 'Choose which packages to build\n  ● selected ○ unselected\n',
          choices: packages.map((pkg) => pkg.name),
          default: packagesToBuild,
          pageSize: Math.min(packages.length, (process.stdout.rows || 100) - 2),
        },
      ]);
      packagesToBuild = result.packagesToBuild;
    }
  }

  try {
    const failedPackagesCount = await _updateExpoViewAsync(
      packages.filter((pkg) => packagesToBuild.includes(pkg.name)),
      options.sdkVersion
    );
    if (failedPackagesCount > 0) {
      process.exitCode = 1;
    }
  } catch (e) {
    await _exitHandler();
    throw e;
  }
}

async function _exitHandler(): Promise<void> {
  if (Object.keys(savedFiles).length) {
    console.log('Exited early, cleaning up...');
    await _restoreFilesAsync();
  }
}

export default (program: any) => {
  program
    .command('android-build-packages')
    .alias('abp')
    .description('Builds all Android AAR packages for Turtle')
    .option('-s, --sdkVersion [string]', '[optional] SDK version')
    .option(
      '-p, --packages [string]',
      '[optional] packages to build. May be `all`, `suggested`, or a comma-separate list of package names.'
    )
    .asyncAction(async (options: Partial<ActionOptions>) => {
      const sdkVersion =
        options.sdkVersion ?? (await ProjectVersions.getNewestSDKVersionAsync('android'));

      if (!sdkVersion) {
        throw new Error('Could not infer SDK version, please run with `--sdkVersion SDK_VERSION`');
      }

      await action({ ...options, sdkVersion });
    });
};
