import os from 'os';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import JsonFile from '@expo/json-file';
import semver from 'semver';
import inquirer from 'inquirer';
import spawnAsync from '@expo/spawn-async';
import { Command } from '@expo/commander';

import * as Directories from '../Directories';
import { Package, getListOfPackagesAsync } from '../Packages';

interface PipelineConfig {
  pkg: Package;
  currentVersion?: string;
  newVersion?: string;
  shouldPublish?: boolean;
  published?: boolean;
  packageView?: PackageView;
  packageJson?: { [key: string]: any };
  maintainers?: string[];
  tarballFilename?: string;

  [key: string]: any;
}

interface PackageView {
  currentVersion: string;
  publishedDate: Date;
  [key: string]: any;
}

interface Options {
  [key: string]: any;
}

type PipelineAction = (
  pipeline: PipelineConfig,
  configs: Map<string, PipelineConfig>,
  options: Options
) => any;

type WorkspaceProject = {
  location: string;
  workspaceDependencies: string[];
  mismatchedWorkspaceDependencies: string[];
};

const defaultOptions = {
  tag: 'latest',
  release: 'patch',
  prerelease: null,
  version: null,
  force: false,
  forceVersions: false,
  dry: false,
  scope: null,
  exclude: null,
};

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

// sed command differs between platforms
const SED = os.platform() === 'linux' ? 'sed' : 'gsed';

// list of teams owning the packages - script will ensure all of these teams are owning published packages
const TEAMS_WITH_RW_ACCESS = ['expo:developers', 'expo:swm'];

const beforePublishPipeline: PipelineAction[] = [
  _preparePublishAsync,
  _bumpVersionsAsync,
  _saveGitHeadAsync,
  _prepackAsync,
];

const publishPipeline: PipelineAction[] = [_publishAsync, _addPackageOwnersAsync, _cleanupAsync];

const getWorkspacesInfoAsync = (() => {
  let cache;

  return async (): Promise<{ [key: string]: WorkspaceProject }> => {
    if (!cache) {
      const child = await spawnAsync('yarn', ['workspaces', 'info', '--json'], {
        cwd: EXPO_DIR,
      });
      const output = JSON.parse(child.stdout);
      cache = JSON.parse(output.data);
    }
    return cache;
  };
})();

async function _spawnAsync(
  command: string,
  args: ReadonlyArray<string>,
  options: any = {}
): Promise<any> {
  return await spawnAsync(command, args, {
    cwd: EXPO_DIR,
    ...options,
  });
}

async function _spawnJSONCommandAsync(
  command: string,
  args: ReadonlyArray<string>,
  options: any = {}
): Promise<any> {
  const child = await _spawnAsync(command, args, options);
  return JSON.parse(child.stdout);
}

async function _spawnAndCatchAsync(
  command: string,
  args: ReadonlyArray<string>,
  options: any = {}
): Promise<any> {
  try {
    return await _spawnAsync(command, args, options);
  } catch (error) {
    return error;
  }
}

async function _runPipelineAsync(
  pipeline: PipelineAction[],
  publishConfigs: Map<string, PipelineConfig>,
  options: Options
): Promise<void> {
  for (const action of pipeline) {
    for (const [packageName, publishConfig] of publishConfigs) {
      const runAction = async () => {
        try {
          const newConfig = await action(publishConfig, publishConfigs, options);

          if (newConfig) {
            publishConfigs.set(packageName, { ...publishConfig, ...newConfig });
          }
        } catch (e) {
          console.log(
            chalk.red(`Pipeline failed for package ${chalk.green(packageName)} with reason:`),
            chalk.gray(e.stack)
          );

          if (e.stderr) {
            e.stderr.split(/\r?\n/g).forEach(line => {
              console.error(chalk.red('stderr >'), line);
            });
          }

          const select = await _selectPromptAsync(`Do you want to (s)kip this package or (e)xit?`, [
            's',
            'e',
          ]);

          if (select === 's') {
            publishConfigs.delete(packageName);
          } else {
            process.exit(1);
          }
        }
      };
      await runAction();
    }
  }
}

async function _getPackageViewFromRegistryAsync(packageName: string, version?: string): Promise<PackageView | null> {
  try {
    const json = await _spawnJSONCommandAsync('npm', ['view', version ? `${packageName}@${version}` : packageName, '--json']);

    if (json && !json.error) {
      const currentVersion = json.versions[json.versions.length - 1];
      const publishedDate = json.time[currentVersion];

      if (!publishedDate || !currentVersion) {
        return null;
      }

      json.currentVersion = currentVersion;
      json.publishedDate = new Date(publishedDate);

      return json;
    }
  } catch (error) {}
  return null;
}

async function _gitLogWithFormatAsync(
  pkg: Package,
  sinceDate: Date,
  format: string,
  paths: string[] = ['.']
): Promise<{ lines: string[] }> {
  const child = await _spawnAsync(
    'git',
    [
      'log',
      `--since="${sinceDate.toISOString()}"`,
      `--pretty=format:${format}`,
      '--color',
      '--',
      ...paths,
    ],
    {
      stdio: 'pipe',
      cwd: pkg.path,
    }
  );

  return {
    lines: child.stdout
      .trim()
      .split(/\r?\n/g)
      .filter(a => a),
  };
}

async function _gitAddAsync(pathToAdd: string, cwd: string = EXPO_DIR): Promise<void> {
  try {
    return await _spawnAsync('git', ['add', pathToAdd], { cwd });
  } catch (error) {
    // Nothing: sometimes gitignored files might throw errors here, but we don't care.
  }
}

async function _checkNativeChangesSinceAsync(pkg: Package, date: Date): Promise<boolean> {
  const nativeDirsLog = await _gitLogWithFormatAsync(pkg, date, '%h', ['ios', 'android']);
  return nativeDirsLog.lines.length > 0;
}

async function _listCommitsSinceAsync(
  pkg: Package,
  date: Date,
  silent: boolean = false
): Promise<{ numberOfCommits: number; firstCommit: string | null }> {
  const format =
    '%C(yellow)>%Creset %C(green)%an%Creset, %C(cyan)%cr%Creset, (%C(yellow)%h%Creset) %C(blue)%s%Creset';
  const log = await _gitLogWithFormatAsync(pkg, date, format);
  const rawLog = await _gitLogWithFormatAsync(pkg, date, '%h');

  if (log.lines.length === 0) {
    console.log(chalk.yellow('No new commits since last publish. 🤷‍♂️\n'));
    return { numberOfCommits: 0, firstCommit: null };
  }

  const { lines } = rawLog;
  const firstCommit = lines.length > 0 ? lines[lines.length - 1] : null;

  if (!silent) {
    console.log(chalk.gray('New commits since last publish:'));
    console.log(log.lines.join(os.EOL));
    console.log();
  }

  return {
    numberOfCommits: lines.length,
    firstCommit,
  };
}

function _isPrereleaseVersion(version: string): boolean {
  const prerelease = semver.prerelease(version);
  return prerelease != null;
}

function _findDefaultVersion(
  packageJson,
  packageView: PackageView | null,
  options: Options
): string {
  // if packagejson.version is greater than the released version, then use this version as a default value
  // otherwise, increment the current version as patch release

  let defaultVersion = packageView ? packageView.currentVersion : packageJson.version;

  if (options.prerelease) {
    if (!packageView) {
      return `${defaultVersion}-${options.prerelease}.0`;
    }
    if (_isPrereleaseVersion(defaultVersion)) {
      // options.release doesn't matter if the current version is also prerelease
      return semver.inc(defaultVersion, 'prerelease', options.prerelease);
    }
    return semver.inc(defaultVersion, `pre${options.release}`, options.prerelease);
  }
  return packageView ? semver.inc(defaultVersion, options.release) : packageJson.version;
}

async function _checkGNUSed(): Promise<void> {
  // this should crash on BSD sed - it means GNU sed was not installed properly.
  let child;

  try {
    child = await _spawnAsync(SED, ['--version']);
  } catch (error) {
    child = error;
  } finally {
    if (child.stderr) {
      console.error(
        chalk.red(
          `\nGNU version of 'sed' is required but not installed. On MacOS, run 'brew install gnu-sed' to install it.\n`
        )
      );
      process.exit(0);
    }
  }
}

async function _authenticateNpm(): Promise<void> {
  const profile = await _spawnJSONCommandAsync('npm', ['profile', 'get', '--json']);

  if (profile.error) {
    console.log(
      chalk.red('\nSeems like you are not authenticated in npm. Please run `npm login` first.\n')
    );
    process.exit(0);
    return;
  }
  if (profile.tfa && profile.tfa.mode === 'auth-and-writes') {
    console.error(
      chalk.red(
        'Looks like you are using two-factor authentication mode that is not supported by this script.'
      )
    );
    console.error(
      chalk.red(
        'Change your 2fa mode to "auth-only" or temporarily disable it with `npm profile disable-2fa`.'
      )
    );
    process.exit(0);
    return;
  }
  return profile;
}

async function _askForVersionAsync(
  pkg: Package,
  currentVersion: string | null,
  defaultVersion: string,
  packageView: PackageView | null,
  options: any
): Promise<string> {
  if (options && options.version) {
    if (
      semver.valid(options.version) &&
      (!currentVersion || semver.gt(options.version, currentVersion))
    ) {
      return options.version;
    }
    console.log(
      `Version '${options.version}' is invalid or not greater than the published version.`
    );
  }
  if (
    packageView &&
    packageView.publishedDate &&
    (await _checkNativeChangesSinceAsync(pkg, packageView.publishedDate))
  ) {
    console.log(
      chalk.yellow(`Detected changes in native code! Consider bumping at least minor number.`)
    );
  }
  if (options.forceVersions) {
    return defaultVersion;
  }
  const result = await inquirer.prompt<{ version: string }>([
    {
      type: 'input',
      name: 'version',
      message: `What is the new version of ${chalk.green(pkg.packageName)} package?`,
      default: defaultVersion,
      validate(value) {
        if (semver.valid(value)) {
          if (!currentVersion || semver.gt(value, currentVersion)) {
            return true;
          }
          return `Version "${value}" is not greater than the current version "${currentVersion}"!`;
        }
        return `${value} is not a valid semver version!`;
      },
    },
  ]);
  return result.version;
}

async function _promptAsync(message, defaultValue = true): Promise<boolean> {
  const result = await inquirer.prompt<{ result: boolean }>([
    {
      type: 'confirm',
      name: 'result',
      message,
      default: defaultValue,
    },
  ]);
  return result.result;
}

async function _selectPromptAsync(message: string, inputs: string[] = []): Promise<string> {
  const result = await inquirer.prompt<{ result: string }>([
    {
      type: 'input',
      name: 'result',
      message,
      default: inputs[0],
    },
  ]);
  if (!inputs.includes(result.result)) {
    console.error(chalk.red(`Invalid option: ${result.result}`));
    return _selectPromptAsync(message, inputs);
  }
  return result.result;
}

async function _publishPromptAsync(sinceCommit: string, pkgPath: string): Promise<boolean> {
  const select = await _selectPromptAsync(
    `Do you want to (p)ublish these changes, show a (d)iff or (s)kip this package?`,
    ['p', 'd', 's']
  );

  if (select === 'd') {
    // show git diff for the package

    console.log();
    await _spawnAsync(
      'git',
      [
        'diff',
        '--text',
        '--color',
        `${sinceCommit}^`,
        'HEAD',
        '--',
        path.relative(EXPO_DIR, pkgPath),
      ],
      { stdio: 'inherit' }
    );
    console.log();

    return _publishPromptAsync(sinceCommit, pkgPath);
  }
  return select === 'p';
}

async function _getMaintainersAsync(packageName: string): Promise<string[]> {
  const child = await _spawnAsync('npm', ['owner', 'ls', packageName]);
  const maintainers = child.stdout.split(/\r?\n/g);
  return maintainers.map(maintainer => maintainer.replace(/\s<.*>$/g, ''));
}

async function _preparePublishAsync(
  pipelineConfig: PipelineConfig,
  allConfigs: Map<string, PipelineConfig>,
  options: Options
): Promise<any> {
  const { pkg } = pipelineConfig;
  const isScoped =
    (options.scope.length === 0 || options.scope.includes(pkg.packageName)) &&
    !options.exclude.includes(pkg.packageName);
  // early bailout
  if (!isScoped) {
    return { shouldPublish: false };
  }

  const packageJson = require(path.join(pkg.path, 'package.json'));
  const packageView = await _getPackageViewFromRegistryAsync(pkg.packageName);
  const currentVersion = packageView && packageView.currentVersion;
  const defaultVersion = _findDefaultVersion(packageJson, packageView, options);
  const maintainers = packageView ? await _getMaintainersAsync(pkg.packageName) : [];
  const isMaintainer = !packageView || maintainers.includes(options.npmProfile.name);

  let newVersion = currentVersion;
  let shouldPublish = false;
  let isSubmodule: boolean | undefined;

  if (isScoped) {
    console.log(`Preparing ${chalk.bold.green(pkg.packageName)}... 👨‍🍳`);

    if (packageView && currentVersion) {
      // package is already published

      if (!isMaintainer) {
        console.log(
          chalk.red(
            `Looks like you are not an owner of ${chalk.green(
              pkg.packageName
            )} package. You will not be able to publish it.`
          )
        );

        if (
          await _promptAsync(
            'Ask someone to give you an access and type `y` to retry. Otherwise, the package will be skipped.',
            false
          )
        ) {
          return await _preparePublishAsync(pipelineConfig, allConfigs, options);
        }
        console.log();
      } else {
        console.log(
          `${chalk.green(pkg.packageName)}@${chalk.red(
            currentVersion
          )} was published at ${chalk.cyan(packageView.publishedDate.toISOString())}`
        );

        const { numberOfCommits, firstCommit } = await _listCommitsSinceAsync(
          pkg,
          packageView.publishedDate,
          options.force
        );

        if (numberOfCommits > 0 || options.force) {
          // there are new commits since last publish
          shouldPublish = options.force || (await _publishPromptAsync(firstCommit!, pkg.path));
        } else {
          // package probably haven't changed - no new commits
          shouldPublish = await _promptAsync(
            `Seems like ${chalk.green(
              pkg.packageName
            )} hasn't changed since last publish. Do you want to publish it anyway?`
          );
        }
      }
    } else {
      // package not published
      console.log(chalk.green(pkg.packageName), chalk.yellow('has not been published yet.'));

      shouldPublish = options.force || (await _promptAsync(`Do you want to publish it now?`));
    }
  }

  if (shouldPublish) {
    newVersion = await _askForVersionAsync(
      pkg,
      currentVersion,
      defaultVersion,
      packageView,
      options
    );
    isSubmodule = await _isGitSubmoduleAsync(pkg);

    if (isSubmodule) {
      await _checkoutGitSubmoduleAsync(pkg);
    }
    console.log();
  }

  return {
    currentVersion,
    newVersion,
    packageView,
    shouldPublish,
    packageJson,
    maintainers,
    isSubmodule,
  };
}

async function _bumpVersionsAsync({
  pkg,
  newVersion,
  shouldPublish,
}: PipelineConfig): Promise<any> {
  if (!shouldPublish) {
    return;
  }

  console.log(`Updating versions in ${chalk.green(pkg.packageName)} package... ☝️`);

  await JsonFile.setAsync(path.join(pkg.path, 'package.json'), 'version', newVersion);

  console.log(chalk.yellow('>'), `Updated package version in ${chalk.magenta('package.json')}`);

  if (fs.existsSync(path.join(pkg.path, 'android/build.gradle'))) {
    // update version and versionName in android/build.gradle

    const buildGradlePath = path.relative(EXPO_DIR, path.join(pkg.path, 'android/build.gradle'));
    const sedPatterns = [
      `s/version\\s*=\\s*'[^']*'/version = '${newVersion}'/g`,
      `s/versionName\\s*"[^"]*"/versionName "${newVersion}"/g`,
    ];

    for (const sedPattern of sedPatterns) {
      await _spawnAsync(SED, ['-i', '--', sedPattern, buildGradlePath]);
    }

    console.log(
      chalk.yellow('>'),
      `Updated package version in ${chalk.magenta('android/build.gradle')}`
    );

    // find versionCode
    const versionCodeChild = await _spawnAndCatchAsync(SED, [
      '-n',
      '/versionCode \\d*/p',
      buildGradlePath,
    ]);
    const versionCodeLine = versionCodeChild.stdout.trim().split(/\r?\n/g)[0];

    if (versionCodeLine) {
      const versionCodeInt = +versionCodeLine.replace(/\D+/g, '');
      const newVersionCode = 1 + versionCodeInt;

      await _spawnAsync(SED, [
        '-i',
        '--',
        `s/versionCode ${versionCodeInt}/versionCode ${newVersionCode}/`,
        buildGradlePath,
      ]);

      console.log(
        chalk.yellow('>'),
        `Updated version code ${chalk.cyan(String(versionCodeInt))} -> ${chalk.cyan(
          String(newVersionCode)
        )}`,
        `in ${chalk.magenta('android/build.gradle')}`
      );
    }
  }

  // Add unimodules to bundledNativeModules.json so the correct version will be installed by `expo install`.
  if (pkg.isUnimodule()) {
    await JsonFile.setAsync(
      path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json'),
      pkg.packageName,
      `~${newVersion}`
    );
    console.log(
      chalk.yellow('>'),
      `Updated package version in`,
      chalk.magenta('packages/expo/bundledNativeModules.json')
    );
  }

  await _updateWorkspaceDependenciesAsync({ pkg, newVersion } as PipelineConfig);
  console.log();
}

async function _updateWorkspaceDependenciesAsync({
  pkg,
  newVersion,
}: PipelineConfig): Promise<any> {
  const workspaceProjects = await getWorkspacesInfoAsync();
  const dependenciesKeys = ['dependencies', 'devDependencies', 'peerDependencies'];

  for (const projectName in workspaceProjects) {
    const project = workspaceProjects[projectName];

    if (!project.workspaceDependencies.includes(pkg.packageName)) {
      continue;
    }

    const jsonFile = new JsonFile(path.join(EXPO_DIR, project.location, 'package.json'));
    const packageJson = await jsonFile.readAsync();

    for (const dependenciesKey of dependenciesKeys) {
      const dependencies = packageJson[dependenciesKey];

      if (dependencies && dependencies[pkg.packageName]) {
        // Set app's dependency to the new version.
        await jsonFile.setAsync(`${dependenciesKey}.${pkg.packageName}`, `~${newVersion}`);
        console.log(
          chalk.yellow('>'),
          `Updated package version in the ${chalk.blue(dependenciesKey)} of the ${chalk.green(
            projectName
          )} workspace project`
        );
      }
    }
  }
}

async function _saveGitHeadAsync({ pkg, shouldPublish }: PipelineConfig): Promise<any> {
  if (!shouldPublish) {
    return;
  }

  const packagePath = path.join(pkg.path, 'package.json');
  const child = await _spawnAsync('git', ['rev-parse', '--verify', 'HEAD']);

  await JsonFile.setAsync(packagePath, 'gitHead', child.stdout.trim());
}

async function _prepackAsync({
  pkg,
  newVersion,
  shouldPublish,
}: PipelineConfig): Promise<{ tarballFilename: string } | undefined> {
  if (!shouldPublish) {
    return;
  }

  console.log(`Packaging ${chalk.green(pkg.packageName)}... 📦`);

  await _spawnAsync('npm', ['pack'], {
    stdio: 'ignore',
    cwd: pkg.path,
  });

  const tarballFilename = `${pkg.packageSlug}-${newVersion}.tgz`;

  return { tarballFilename };
}

async function _publishAsync(
  { pkg, tarballFilename, shouldPublish, newVersion }: PipelineConfig,
  allConfigs: Map<string, PipelineConfig>,
  options: Options
): Promise<any> {
  if (!shouldPublish) {
    return;
  }
  console.log(`Publishing ${chalk.green(pkg.packageName)}... 🚀`);

  if (options.dry) {
    console.log(chalk.gray(`Publishing skipped because of --dry flag.`));
  } else {
    await _spawnAsync(
      'yarn',
      ['publish', tarballFilename, '--tag', options.tag, '--new-version', newVersion],
      {
        cwd: pkg.path,
        env: {
          ...process.env,
          npm_config_tag: options.tag,
        },
      }
    );

    // Unfortunately, `npm publish` doesn't provide --json flag, so the best way to check if it succeded
    // is to check if the new package view resolves current version to the new version we just tried publishing
    const newPackageView = await _getPackageViewFromRegistryAsync(pkg.packageName, newVersion);

    if (newPackageView && newPackageView.currentVersion === newVersion) {
      console.log(
        `🚀🚀 Successfully published ${chalk.green(pkg.packageName)}@${chalk.red(newVersion)} 🎉🎉`
      );
      return { published: true };
    } else {
      console.error(
        chalk.red(
          `🚀 🌊 The rocket with ${chalk.green(
            pkg.packageName
          )} fell into the ocean, but don't worry, the crew survived. 👨‍🚀`
        )
      );

      if (
        await _promptAsync(
          `It might be an intermittent issue. Do you confirm it has been published? Check out ${chalk.blue(`https://www.npmjs.com/package/${pkg.packageName}`)}.`
        )
      ) {
        return { published: true };
      }
      if (await _promptAsync(`Do you want to retry publishing ${chalk.green(pkg.packageName)}?`)) {
        return _publishAsync(
          { pkg, tarballFilename, shouldPublish, newVersion },
          allConfigs,
          options
        );
      }
      return { published: false };
    }
  }
}

async function _addPackageOwnersAsync({
  pkg,
  published,
  packageView,
}: PipelineConfig): Promise<void> {
  // Grant read-write access to the teams but only if the package wasn't published before (no package view).
  if (published && !packageView && TEAMS_WITH_RW_ACCESS.length > 0) {
    console.log(`\nGranting ${chalk.green(pkg.packageName)} read-write access to teams:`);

    for (const teamToAdd of TEAMS_WITH_RW_ACCESS) {
      try {
        await _spawnAsync('npm', ['access', 'grant', 'read-write', teamToAdd], {
          cwd: pkg.path,
        });
        console.log(chalk.yellow('+'), chalk.blue(teamToAdd));
      } catch (error) {
        console.error(chalk.red(error.stdout || error.message));
      }
    }
  }
}

async function _cleanupAsync({ pkg, tarballFilename }: PipelineConfig): Promise<void> {
  if (!tarballFilename) {
    return;
  }
  console.log(`Cleaning up ${chalk.green(pkg.packageName)}... 🛁`);
  await fs.remove(path.join(pkg.path, tarballFilename));
}

async function _isGitSubmoduleAsync(pkg: Package): Promise<boolean> {
  const child = await _spawnAsync('git', ['rev-parse', '--show-toplevel'], {
    cwd: pkg.path,
  });
  return child.stdout.trim() === pkg.path;
}

async function _checkoutGitSubmoduleAsync(pkg: Package): Promise<void> {
  const { branchName } = await inquirer.prompt<{ branchName: string }>([
    {
      type: 'input',
      name: 'branchName',
      message: `Type in ${chalk.bold.green(pkg.packageName)} submodule branch to checkout:`,
      default: 'master',
    }
  ]);

  await _spawnAsync('git', ['fetch'], { cwd: pkg.path });
  await _spawnAsync('git', ['checkout', '-B', branchName], { cwd: pkg.path });
}

async function _gitAddAndCommitAsync(allConfigs: Map<string, PipelineConfig>): Promise<void> {
  console.log();

  if (await _promptAsync('Do you want to commit changes made by this script?')) {
    // Link dependencies within yarn workspaces.
    for (const project of Object.values(await getWorkspacesInfoAsync())) {
      await _gitAddAsync('package.json', path.join(EXPO_DIR, project.location));
    }

    // Add some files from iOS project that are being touched by `pod update` command
    await _gitAddAsync('ios/Podfile.lock');
    await _gitAddAsync('ios/Pods');

    // Add expoview's build.gradle in which the dependencies were updated
    await _gitAddAsync('android/expoview/build.gradle');

    // Update package versions in expo's bundledNativeModules.
    await _gitAddAsync('packages/expo/bundledNativeModules.json');

    const publishedPackages: string[] = [];

    // Add files from updated packages and submodules.
    for (const { pkg, newVersion, shouldPublish, isSubmodule } of allConfigs.values()) {
      if (shouldPublish && newVersion) {
        publishedPackages.push(`${pkg.packageName}@${newVersion}`);

        const files = ['package.json', 'yarn.lock', 'build', 'android/build.gradle'];

        // Add to git index.
        for (const file of files) {
          const fullPath = path.join(pkg.path, file);
          if (await fs.exists(fullPath)) {
            await _gitAddAsync(file, pkg.path);
          }
        }

        // We need to do a bit more if the package is also a submodule, like react-native-unimodules.
        if (isSubmodule) {
          // Commit changes in the submodule.
          await _gitCommitWithPromptAsync(
            pkg.packageName,
            `Publish version ${newVersion}`,
            '',
            pkg.path
          );

          // Add submodule changes to the main repo.
          await _gitAddAsync(pkg.path);
        }
      }
    }

    await _gitCommitWithPromptAsync(
      'expo',
      'Publish packages',
      publishedPackages.join('\n'),
      EXPO_DIR,
    );
    console.log();
  }
}

async function _gitCommitWithPromptAsync(
  repositoryName: string,
  defaultCommitMessage: string,
  commitDescription: string,
  cwd: string,
): Promise<void> {
  const { commitMessage } = await inquirer.prompt<{ commitMessage: string }>([
    {
      type: 'input',
      name: 'commitMessage',
      message: `Type in commit message for ${chalk.green(repositoryName)} repository:`,
      default: defaultCommitMessage,
    },
  ]);
  await _spawnAsync('git', ['commit', '-m', commitMessage, '-m', commitDescription], { cwd });
}

async function _updatePodsAsync(allConfigs: Map<string, PipelineConfig>): Promise<void> {
  const podspecNames = [...allConfigs.values()]
    .filter(
      config =>
        config.pkg.podspecName &&
        config.shouldPublish &&
        config.pkg.isIncludedInExpoClientOnPlatform('ios')
    )
    .map(config => config.pkg.podspecName) as string[];

  if (podspecNames.length === 0) {
    // no native iOS pods to update
    return;
  }
  if (await _promptAsync(`Do you want to update pods in ${chalk.magenta('expo/ios')}?`)) {
    // Update all pods that have been published
    console.log(`\nUpdating pods: ${chalk.green(podspecNames.join(' '))}`);

    await _spawnAsync('pod', ['update', ...podspecNames, '--no-repo-update'], {
      cwd: path.join(EXPO_DIR, 'ios'),
    });
  }
}

async function publishPackagesAsync(argv: any): Promise<void> {
  await _checkGNUSed();
  const npmProfile = await _authenticateNpm();

  const options = { ...defaultOptions, ...argv };

  if (options.prerelease === true) {
    options.prerelease = 'rc';
  }

  if (options.scope) {
    options.scope = options.scope && options.scope.split(/\s*,\s*/g);
  } else {
    options.scope = [];
  }

  if (options.exclude) {
    options.exclude = options.exclude && options.exclude.split(/\s*,\s*/g);
  } else {
    options.exclude = [];
  }

  // pass our profile as an option to the pipelines
  options.npmProfile = npmProfile;

  const publishConfigs = new Map<string, PipelineConfig>();
  const packages = await getListOfPackagesAsync();

  packages.forEach(pkg => {
    if (pkg.packageName !== 'test_suite_flutter') {
      publishConfigs.set(pkg.packageName, { pkg });
    }
  });

  // --list-packages option is just to debug the config with packages used by the script
  if (options.listPackages) {
    console.log(chalk.yellow('\nList of packages used by this script... 📝\n'));

    packages.forEach(pkg => {
      const packageJson = require(path.join(pkg.path, 'package.json'));
      const podspecName = pkg.podspecName;

      console.log('📦', chalk.bold.green(pkg.packageName));
      console.log(
        chalk.yellow('>'),
        'directory:',
        chalk.magenta(path.relative(EXPO_DIR, pkg.path))
      );
      console.log(chalk.yellow('>'), 'slug:', chalk.green(pkg.packageSlug));
      console.log(chalk.yellow('>'), 'version:', chalk.red(packageJson.version));
      console.log(chalk.yellow('>'), 'is unimodule:', chalk.blue(String(pkg.isUnimodule())));
      console.log(
        chalk.yellow('>'),
        'pod name:',
        podspecName ? chalk.green(podspecName) : chalk.gray('undefined')
      );
      console.log();
    });

    return;
  }

  console.log(chalk.yellow('\nCollecting data about packages...\n'));

  await _runPipelineAsync(beforePublishPipeline, publishConfigs, options);

  if (![...publishConfigs.values()].some(config => !!config.shouldPublish)) {
    console.log('\nNo packages to publish 🤷‍♂️');
    process.exit(0);
    return;
  }

  if (options.dry) {
    console.log(
      `\nFollowing packages would be published but you used ${chalk.gray('--dry')} flag:`
    );
  } else {
    console.log('\nFollowing packages will be published:');
  }

  for (const { pkg, currentVersion, newVersion, shouldPublish } of publishConfigs.values()) {
    if (shouldPublish && currentVersion && newVersion) {
      console.log(
        `${chalk.green(pkg.packageName)}: ${chalk.red(currentVersion)} -> ${chalk.red(
          newVersion
        )} (${chalk.cyan(options.tag)})`
      );
    }
  }

  console.log();

  if (await _promptAsync('Is this correct? Are you ready to launch a rocket into space? 🚀')) {
    await _updatePodsAsync(publishConfigs);
    await _gitAddAndCommitAsync(publishConfigs);
    await _runPipelineAsync(publishPipeline, publishConfigs, options);
  } else {
    await _runPipelineAsync([_cleanupAsync], publishConfigs, options);
  }

  console.log();
}

export default (program: Command) => {
  program
    .command('publish-packages')
    .alias('pub-pkg', 'pp')
    .option('-l, --list-packages', 'Lists all packages the script can publish.')
    .option(
      '-t, --tag [string]',
      "NPM tag to use when publishing packages. Defaults to `latest`. Use `next` if you're publishing release candidates.",
      'latest'
    )
    .option(
      '-r, --release [string]',
      'Specifies how to bump current versions to the new one. Possible values: `patch`, `minor`, `major`. Defaults to `patch`.',
      'patch'
    )
    .option(
      '-p, --prerelease [string]',
      'If used, the default new version will be a prerelease version like `1.0.0-rc.0`. You can pass another string if you want prerelease identifier other than `rc`.'
    )
    .option(
      '-v, --version [string]',
      'Imposes given version as a default version for all packages.',
      ''
    )
    .option(
      '-s, --scope [string]',
      "Comma-separated names of packages to be published. By default, it's trying to publish all packages defined in `dev/xdl/src/modules/config.js`.",
      ''
    )
    .option(
      '-e, --exclude [string]',
      'Comma-separated names of packages to be excluded from publish. It has a higher precedence than `scope` flag.',
      ''
    )
    .option(
      '-f, --force',
      'Force all packages to be published, even if there were no changes since last publish.',
      false
    )
    .option(
      '-fv, --force-versions',
      'When passed, the script will automatically choose the default version that was calculated based on other flags like `--release` and `--prerelease`.',
      false
    )
    .option(
      '-d, --dry',
      'Whether to skip `npm publish` command. Despite this, some files might be changed after running this script.',
      false
    )
    .description(
      `This script helps in doing a lot of publishing stuff like handling dependency versions in packages that depend on themselves,
updating Android and iOS projects for Expo Client, committing changes that were made by the script and finally publishing.`
    )
    .usage(
      `

To publish packages as release candidates, you might want to use something like:
${chalk.gray('>')} ${chalk.italic.cyan('et publish-packages --tag="next" --prerelease')}

If you want to publish just specific packages:
${chalk.gray('>')} ${chalk.italic.cyan('et publish-packages --scope="expo-gl,expo-gl-cpp"')}

If you want to publish a package with specific version:
${chalk.gray('>')} ${chalk.italic.cyan(
        'et publish-packages --version="1.2.3" --scope="expo-permissions"'
      )}`
    )
    .asyncAction(publishPackagesAsync);
};
