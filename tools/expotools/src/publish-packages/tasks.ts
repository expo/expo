import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import semver from 'semver';

import { EXPO_DIR } from '../Constants';
import Git from '../Git';
import logger from '../Logger';
import * as Npm from '../Npm';
import { getListOfPackagesAsync } from '../Packages';
import { Task } from '../TasksRunner';
import * as Utils from '../Utils';
import * as Workspace from '../Workspace';
import {
  checkBranchNameAsync,
  createParcelAsync,
  doesSomeoneHaveNoAccessToPackage,
  getMinReleaseType,
  highestReleaseTypeReducer,
  printPackageParcel,
  recursivelyAccumulateReleaseTypes,
  recursivelyResolveDependenciesAsync,
  resolveSuggestedVersion,
  shouldStopOnFailedIntegrityChecksAsync,
  selectPackageToPublishAsync,
  getPackageGitLogsAsync,
  commitMessageForOptions,
} from './helpers';
import { CommandOptions, Parcel, TaskArgs, ReleaseType } from './types';

const { green, yellow, cyan, magenta, blue, gray } = chalk;

/**
 * Checks whether the current branch is correct and working dir is not dirty.
 */
export const checkRepositoryStatus = new Task<TaskArgs>(
  {
    name: 'checkRepositoryStatus',
    required: true,
    backupable: false,
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    if (options.skipRepoChecks) {
      return;
    }
    logger.info(`\n🕵️‍♂️ Checking repository status...`);

    const currentBranch = await Git.getCurrentBranchNameAsync();
    const trackingBranch = await Git.getTrackingBranchNameAsync();

    // Check whether it's allowed to publish from the current branch.
    if (!(await checkBranchNameAsync(currentBranch))) {
      return Task.STOP;
    }

    // If tracking branch is set, then we must ensure it is still up-to-date with it.
    if (trackingBranch) {
      await Git.fetchAsync();

      const stats = await Git.compareBranchesAsync(currentBranch, trackingBranch);

      if (stats.ahead + stats.behind > 0) {
        logger.error(
          `🚫 Your local branch ${cyan(currentBranch)} is out of sync with remote branch.`
        );
        return Task.STOP;
      }
    }
    if (await Git.hasUnstagedChangesAsync()) {
      logger.error(`🚫 Repository contains unstaged changes, please make sure to have it clear.`);
      logger.error(`🚫 If you want to include them, they must be committed.`);
      return Task.STOP;
    }
  }
);

/**
 * Gets a list of public packages in the monorepo, downloads `npm view` result of them,
 * creates their Changelog instance and fills in given parcels array (it's empty at the beginning).
 */
export const prepareParcels = new Task<TaskArgs>(
  {
    name: 'prepareParcels',
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('🔎 Gathering data about packages...');

    const { packageNames } = options;
    const allPackages = await getListOfPackagesAsync();
    const allPackagesObj = allPackages.reduce((acc, pkg) => {
      acc[pkg.packageName] = pkg;
      return acc;
    }, {});

    // Verify that provided package names are valid.
    for (const packageName of packageNames) {
      if (!allPackagesObj[packageName]) {
        throw new Error(`Package with provided name ${green(packageName)} does not exist.`);
      }
    }

    const filteredPackages = allPackages.filter((pkg) => {
      const isPrivate = pkg.packageJson.private;
      const isIncluded = packageNames.length === 0 || packageNames.includes(pkg.packageName);
      return !isPrivate && isIncluded;
    });

    parcels.push(...(await Promise.all(filteredPackages.map(createParcelAsync))));

    if (packageNames.length > 0) {
      // Even if some packages have been explicitly listed as command arguments,
      // we also must take their dependencies into account.

      const parcelsObj = parcels.reduce((acc, parcel) => {
        acc[parcel.pkg.packageName] = parcel;
        return acc;
      }, {});

      await recursivelyResolveDependenciesAsync(allPackagesObj, parcelsObj, parcels);
    }
  }
);

/**
 * Checks packages integrity and warns about violations.
 * Integrity is violated if the current version of a package:
 * - has no `gitHead` property in its package view.
 * - commit to which `gitHead` refers is not an ancestor of the current head commit.
 * - mismatches last version found in changelog.
 */
export const checkPackagesIntegrity = new Task<TaskArgs>(
  {
    name: 'checkPackagesIntegrity',
    dependsOn: [prepareParcels],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol> => {
    logger.info('\n👁  Checking packages integrity...');

    const resolver = async ({ pkg, pkgView, changelog }: Parcel): Promise<boolean> => {
      if (!pkgView) {
        // If package view is not there, then the package hasn't been released yet - no need to check integrity.
        return true;
      }

      const isAncestor = !!pkgView.gitHead && (await Git.isAncestorAsync(pkgView.gitHead));
      const lastChangelogVersion = await changelog.getLastPublishedVersionAsync();
      const isVersionMatching = !lastChangelogVersion || pkgView.version === lastChangelogVersion;
      const integral = isAncestor && isVersionMatching;

      if (!integral) {
        logger.warn(`\n⚠️  Integrity checks failed for ${green(pkg.packageName)}.`);
      }
      if (!pkgView.gitHead) {
        logger.warn(`   Cannot find ${blue('gitHead')} in package view.`);
      } else if (!isAncestor) {
        logger.warn(
          `   Local version ${cyan(pkgView.version)} has been published from different branch.`
        );
      }
      if (!isVersionMatching) {
        logger.warn(
          `   Last version in changelog ${cyan(lastChangelogVersion!)}`,
          `doesn't match local version ${cyan(pkgView.version)}.`
        );
      }
      return integral;
    };

    const results = await Promise.all(parcels.map(resolver));
    const somethingFailed = results.some((result) => !result);

    if (options.checkIntegrity) {
      if (somethingFailed) {
        logger.error('\n🚫 Integrity checks failed.');
      } else {
        logger.success('\n✅ All integrity checks passed.');
      }
      return;
    }
    if (somethingFailed && (await shouldStopOnFailedIntegrityChecksAsync())) {
      if (process.env.CI) {
        throw new Error('Some integrity checks failed – it is prohibited on the CI.');
      }
      return Task.STOP;
    }
  }
);

/**
 * Finds unpublished packages. Package is considered unpublished if there are
 * any new commits or changelog entries prior to previous publish on the current branch.
 */
export const findUnpublished = new Task<TaskArgs>(
  {
    name: 'findUnpublished',
    dependsOn: [prepareParcels],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<void | symbol | TaskArgs> => {
    logger.info('\n👀 Searching for packages with unpublished changes...');

    const newParcels = await Utils.filterAsync(parcels, async (parcel) => {
      const { pkgView, changelog, gitDir, state } = parcel;
      const changelogChanges = await changelog.getChangesAsync();
      const logs = await getPackageGitLogsAsync(gitDir, pkgView?.gitHead);

      state.logs = logs;
      state.changelogChanges = changelogChanges;
      state.minReleaseType = getMinReleaseType(parcel);

      // Return whether the package has any unpublished changes or git logs couldn't be obtained.
      return !logs || logs.commits.length > 0 || changelogChanges.totalCount > 0;
    });

    if (newParcels.length === 0) {
      logger.success('\n✅ All packages are up-to-date.');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);

/**
 * Resolves parcel's release type and version, based on its `minReleaseType` and its dependencies.
 */
export const resolveReleaseTypeAndVersion = new Task<TaskArgs>(
  {
    name: 'resolveReleaseTypeAndVersion',
    dependsOn: [findUnpublished],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const prerelease = options.prerelease === true ? 'rc' : options.prerelease || undefined;

    for (const parcel of parcels) {
      const { pkg, pkgView, state } = parcel;

      // Find the highest release type among parcel's dependencies.
      const accumulatedTypes = recursivelyAccumulateReleaseTypes(parcel);
      const highestReleaseType = [...accumulatedTypes].reduce(
        highestReleaseTypeReducer,
        ReleaseType.PATCH
      );

      // Make it a prerelease version if `--prerelease` was passed and assign to the state.
      state.releaseType = prerelease
        ? (('pre' + highestReleaseType) as ReleaseType)
        : highestReleaseType;

      // Calculate version to should bump to.
      state.releaseVersion = resolveSuggestedVersion(
        pkg.packageVersion,
        pkgView?.versions ?? [],
        state.releaseType,
        prerelease
      );
    }
  }
);

/**
 * Lists packages that have any unpublished changes.
 */
export const listUnpublished = new Task<TaskArgs>(
  {
    name: 'listUnpublished',
    dependsOn: [findUnpublished, resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🧩 Unpublished packages:');
    parcels.forEach(printPackageParcel);
  }
);

/**
 * Prompts which suggested packages are going to be published.
 */
export const selectPackagesToPublish = new Task<TaskArgs>(
  {
    name: 'selectPackagesToPublish',
    dependsOn: [findUnpublished, resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[], options: CommandOptions): Promise<symbol | TaskArgs> => {
    logger.info('\n👉 Selecting packages to publish...');

    const newParcels: Parcel[] = [];

    for (const parcel of parcels) {
      printPackageParcel(parcel);

      if (await selectPackageToPublishAsync(parcel)) {
        newParcels.push(parcel);
      }
    }
    if (newParcels.length === 0) {
      logger.success('🤷‍♂️ There is nothing to be published.');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);

/**
 * Updates versions in packages selected to be published.
 */
export const updateVersions = new Task<TaskArgs>(
  {
    name: 'updateVersions',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/package.json'],
  },
  async (parcels: Parcel[]) => {
    logger.info(`\n🆙 Updating versions in ${magenta.bold('package.json')}s...`);

    await Promise.all(
      parcels.map(async ({ pkg, state }) => {
        await JsonFile.setAsync(
          path.join(pkg.path, 'package.json'),
          'version',
          state.releaseVersion
        );
        logger.log(
          '  ',
          `${green(pkg.packageName)}:`,
          `${cyan.bold(pkg.packageVersion)} -> ${cyan.bold(state.releaseVersion!)}`
        );
      })
    );
  }
);

/**
 * Updates `bundledNativeModules.json` file in `expo` package.
 * It's used internally by some `expo-cli` commands so we know which package versions are compatible with `expo` version.
 */
export const updateBundledNativeModulesFile = new Task<TaskArgs>(
  {
    name: 'updateBundledNativeModulesFile',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/expo/bundledNativeModules.json'],
  },
  async (parcels: Parcel[]) => {
    const bundledNativeModulesPath = path.join(EXPO_DIR, 'packages/expo/bundledNativeModules.json');
    const bundledNativeModules = await JsonFile.readAsync<{ [key: string]: string }>(
      bundledNativeModulesPath
    );

    logger.info(`\n✏️  Updating ${magenta.bold('bundledNativeModules.json')} file...`);

    for (const { pkg, state } of parcels) {
      const currentRange = bundledNativeModules[pkg.packageName];
      const newRange = `~${state.releaseVersion}`;

      if (!currentRange) {
        logger.log('  ', green(pkg.packageName), gray('is not defined.'));
        continue;
      }

      logger.log(
        '  ',
        green(pkg.packageName),
        `${cyan.bold(currentRange)} -> ${cyan.bold(newRange)}`
      );

      bundledNativeModules[pkg.packageName] = newRange;
    }

    await JsonFile.writeAsync(bundledNativeModulesPath, bundledNativeModules);
  }
);

/**
 * Updates versions of packages to be published in other workspace projects depending on them.
 */
export const updateWorkspaceProjects = new Task<TaskArgs>(
  {
    name: 'updateWorkspaceProjects',
    filesToStage: ['**/package.json', 'yarn.lock'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n📤 Updating workspace projects...');

    const workspaceInfo = await Workspace.getInfoAsync();
    const dependenciesKeys = ['dependencies', 'devDependencies', 'peerDependencies'];

    const parcelsObject = parcels.reduce((acc, parcel) => {
      acc[parcel.pkg.packageName] = parcel;
      return acc;
    }, {});

    await Promise.all(
      Object.entries(workspaceInfo).map(async ([projectName, projectInfo]) => {
        const projectDependencies = [
          ...projectInfo.workspaceDependencies,
          ...projectInfo.mismatchedWorkspaceDependencies,
        ]
          .map((dependencyName) => parcelsObject[dependencyName])
          .filter(Boolean);

        // If this project doesn't depend on any package we're going to publish.
        if (projectDependencies.length === 0) {
          return;
        }

        // Get copy of project's `package.json`.
        const projectPackageJsonPath = path.join(EXPO_DIR, projectInfo.location, 'package.json');
        const projectPackageJson = await JsonFile.readAsync(projectPackageJsonPath);
        const batch = logger.batch();

        batch.log('  ', green(projectName));

        // Iterate through different dependencies types.
        for (const dependenciesKey of dependenciesKeys) {
          const dependenciesObject = projectPackageJson[dependenciesKey];

          if (!dependenciesObject) {
            continue;
          }

          for (const { pkg, state } of projectDependencies) {
            const currentVersionRange = dependenciesObject[pkg.packageName];

            if (!currentVersionRange) {
              continue;
            }

            // Leave tilde and caret as they are, just replace the version.
            const newVersionRange = currentVersionRange.replace(
              /([\^~]?).*/,
              `$1${state.releaseVersion}`
            );
            dependenciesObject[pkg.packageName] = newVersionRange;

            batch.log(
              '    ',
              `Updating ${yellow(`${dependenciesKey}.${pkg.packageName}`)}`,
              `from ${cyan(currentVersionRange)} to ${cyan(newVersionRange)}`
            );
          }
        }

        // Save project's `package.json`.
        await JsonFile.writeAsync(projectPackageJsonPath, projectPackageJson);

        // Flush batched logs.
        batch.flush();
      })
    );
  }
);

/**
 * Updates version props in packages containing Android's native code.
 */
export const updateAndroidProjects = new Task<TaskArgs>(
  {
    name: 'updateAndroidProjects',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/android/build.gradle'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🤖 Updating Android projects...');

    for (const { pkg, state } of parcels) {
      const gradlePath = path.join(pkg.path, 'android/build.gradle');

      // Some packages don't have android code.
      if (!(await fs.pathExists(gradlePath))) {
        continue;
      }

      const relativeGradlePath = path.relative(EXPO_DIR, gradlePath);

      logger.log(
        '  ',
        `Updating ${yellow('version')} and ${yellow('versionCode')} in ${magenta(
          relativeGradlePath
        )}`
      );

      await Utils.transformFileAsync(gradlePath, [
        {
          // update version and versionName in android/build.gradle
          pattern: /\b(version\s*=\s*|versionName\s+)(['"])(.*?)\2/g,
          replaceWith: `$1$2${state.releaseVersion}$2`,
        },
        {
          pattern: /\bversionCode\s+(\d+)\b/g,
          replaceWith: (match, p1) => {
            const versionCode = parseInt(p1, 10);
            return `versionCode ${versionCode + 1}`;
          },
        },
      ]);
    }
  }
);

/**
 * Updates pods in Expo client's and bare-expo.
 */
export const updateIosProjects = new Task<TaskArgs>(
  {
    name: 'updateIosProjects',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['ios', 'apps/*/ios/**'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n🍎 Updating iOS projects...');

    const nativeApps = Workspace.getNativeApps();

    await Promise.all(
      nativeApps.map(async (nativeApp) => {
        const podspecNames = (
          await Promise.all(
            parcels.map(
              (parcel) =>
                nativeApp.hasLocalPodDependencyAsync(parcel.pkg.podspecName) &&
                parcel.pkg.podspecName
            )
          )
        ).filter(Boolean) as string[];

        if (podspecNames.length === 0) {
          logger.log('  ', `${green(nativeApp.packageName)}: No pods to update.`);
          return;
        }

        logger.log(
          '  ',
          `${green(nativeApp.packageName)}: updating`,
          podspecNames.map((podspecName) => green(podspecName!)).join(', ')
        );

        await Utils.spawnAsync('pod', ['update', ...podspecNames, '--no-repo-update'], {
          cwd: path.join(nativeApp.path, 'ios'),
        });
      })
    );
  }
);

/**
 * Cuts off changelogs - renames unpublished section header
 * to the new version and adds new unpublished section on top.
 */
export const cutOffChangelogs = new Task<TaskArgs>(
  {
    name: 'cutOffChangelogs',
    dependsOn: [resolveReleaseTypeAndVersion],
    filesToStage: ['packages/**/CHANGELOG.md'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n✂️  Cutting off changelogs...');

    await Promise.all(
      parcels.map(async ({ pkg, changelog, state }) => {
        if (!(await changelog.fileExistsAsync())) {
          logger.log('  ', green(pkg.packageName), gray(`- skipped, no changelog file.`));
          return;
        }

        if (state.releaseVersion && !semver.prerelease(state.releaseVersion)) {
          logger.log('  ', green(pkg.packageName) + '...');
          await changelog.cutOffAsync(state.releaseVersion);
        } else {
          logger.log('  ', green(pkg.packageName), gray(`- skipped, it's a prerelease version.`));
        }
      })
    );
  }
);

/**
 * Commits staged changes made by all previous tasks.
 */
export const commitStagedChanges = new Task<TaskArgs>(
  {
    name: 'commitStagedChanges',
    dependsOn: [resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const commitMessage = commitMessageForOptions(options);
    const commitDescription = parcels
      .map(({ pkg, state }) => `${pkg.packageName}@${state.releaseVersion}`)
      .join('\n');

    logger.info(`\n📼 Committing changes with message: ${blue(commitMessage)}`);

    await Git.commitAsync({
      title: commitMessage,
      body: commitDescription,
    });
  }
);

/**
 * Pushes committed changes to remote repo.
 */
export const pushCommittedChanges = new Task<TaskArgs>(
  {
    name: 'pushCommittedChanges',
    dependsOn: [commitStagedChanges],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🏋️  Pushing committed changes to remote repository...');

    if (options.dry) {
      logger.debug('   Skipping due to --dry flag...');
      return;
    }
    const currentBranch = await Git.getCurrentBranchNameAsync();
    await Git.pushAsync({ track: currentBranch });
  }
);

/**
 * Publishes all packages that have been selected to publish.
 */
export const publishPackages = new Task<TaskArgs>(
  {
    name: 'publishPackages',
    dependsOn: [resolveReleaseTypeAndVersion],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n🚀 Publishing packages...');

    const gitHead = await Git.getHeadCommitHashAsync();

    for (const { pkg, state } of parcels) {
      const packageJsonPath = path.join(pkg.path, 'package.json');

      logger.log(
        '  ',
        `${green(pkg.packageName)} version ${cyan(state.releaseVersion!)} as ${yellow(options.tag)}`
      );

      // Update `gitHead` property so it will be available to read using `npm view --json`.
      // Next publish will depend on this to properly get changes made after that.
      await JsonFile.setAsync(packageJsonPath, 'gitHead', gitHead);

      // Publish the package.
      await Npm.publishPackageAsync(pkg.path, options.tag, options.dry);

      // Delete `gitHead` from `package.json` – no need to clutter it.
      await JsonFile.deleteKeyAsync(packageJsonPath, 'gitHead');

      state.published = true;
    }
  }
);

/**
 * Grants package access to the whole team. Applies only when the package
 * wasn't published before or someone from the team is not included in maintainers list.
 */
export const grantTeamAccessToPackages = new Task<TaskArgs>(
  {
    name: 'grantTeamAccessToPackages',
    dependsOn: [prepareParcels],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // There is no good way to check whether the package is added to organization team,
    // so let's get all team members and check if they all are declared as maintainers.
    // If they don't, grant access for the team.
    const teamMembers = await Npm.getTeamMembersAsync(Npm.EXPO_DEVELOPERS_TEAM_NAME);
    const packagesToGrantAccess = parcels.filter(
      ({ pkgView, state }) =>
        (pkgView || state.published) && doesSomeoneHaveNoAccessToPackage(teamMembers, pkgView)
    );

    if (packagesToGrantAccess.length === 0) {
      logger.success('\n🎖  Granting team access not required.');
      return;
    }

    if (!options.dry) {
      logger.info('\n🎖  Granting team access...');

      for (const { pkg } of packagesToGrantAccess) {
        logger.log('  ', green(pkg.packageName));
        await Npm.grantReadWriteAccessAsync(pkg.packageName, Npm.EXPO_DEVELOPERS_TEAM_NAME);
      }
    } else {
      logger.info(
        '\n🎖  Team access would be granted to',
        packagesToGrantAccess.map(({ pkg }) => green(pkg.packageName)).join(', ')
      );
    }
  }
);

/**
 * Pipeline with a bunch of tasks required to publish packages.
 */
export const publishPackagesPipeline = new Task<TaskArgs>(
  {
    name: 'publishPackagesPipeline',
    dependsOn: [
      checkRepositoryStatus,
      prepareParcels,
      checkPackagesIntegrity,
      selectPackagesToPublish,
      updateVersions,
      updateBundledNativeModulesFile,
      updateWorkspaceProjects,
      updateAndroidProjects,
      updateIosProjects,
      cutOffChangelogs,
      commitStagedChanges,
      pushCommittedChanges,
      publishPackages,
      grantTeamAccessToPackages,
    ],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    const count = parcels.length;
    logger.success(
      `\n✅ Successfully published ${cyan.bold(count + '')} package${count > 1 ? 's' : ''}.\n`
    );

    if (options.tag !== 'latest') {
      logger.log(
        `Run ${cyan.bold('et promote-packages')} to promote them to ${yellow('latest')} tag.`
      );
    }
  }
);
