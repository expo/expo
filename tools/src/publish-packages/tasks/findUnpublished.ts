import npmPacklist from 'npm-packlist';

import * as Changelogs from '../../Changelogs';
import { GitDirectory, GitFileLog, GitFileStatus } from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { filterAsync } from '../../Utils';
import { CommandOptions, Parcel, PackageGitLogs, TaskArgs, ReleaseType } from '../types';
import { prepareParcels } from './prepareParcels';

/**
 * An array of directories treated as containing native code.
 */
const NATIVE_DIRECTORIES = ['ios', 'android', 'cpp'];

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

    const newParcels = await filterAsync(parcels, async (parcel) => {
      const { pkgView, changelog, gitDir, state } = parcel;
      const changelogChanges = await changelog.getChangesAsync();
      const logs = await getPackageGitLogsAsync(gitDir, pkgView?.gitHead);

      state.logs = logs;
      state.changelogChanges = changelogChanges;
      state.minReleaseType = await getMinReleaseTypeAsync(parcel);

      // Return whether the package has any unpublished changes or git logs couldn't be obtained.
      return !logs || logs.files.length > 0 || changelogChanges.totalCount > 0 || options.force;
    });

    if (newParcels.length === 0) {
      logger.success('\n✅ All packages are up-to-date.');
      return Task.STOP;
    }
    return [newParcels, options];
  }
);

/**
 * Gets lists of commits and files changed under given directory and since commit with given checksum.
 * Returned files list is filtered out from files ignored by npm when it creates package's tarball.
 * Can return `null` if given commit is not an ancestor of head commit.
 */
async function getPackageGitLogsAsync(
  gitDir: GitDirectory,
  fromCommit?: string
): Promise<PackageGitLogs> {
  if (!fromCommit || !(await gitDir.isAncestorAsync(fromCommit))) {
    return null;
  }

  const commits = await gitDir.logAsync({
    fromCommit,
    toCommit: 'HEAD',
  });

  const gitFiles = await gitDir.logFilesAsync({
    fromCommit,
    toCommit: commits[0]?.hash,
  });

  // Get an array of relative paths to files that will be shipped with the package.
  const packlist = await npmPacklist({ path: gitDir.path });

  // Filter git files to contain only deleted or "packlisted" files.
  const files = gitFiles.filter(
    (file) => file.status === GitFileStatus.D || packlist.includes(file.relativePath)
  );

  return {
    commits,
    files,
  };
}

/**
 * Returns minimum release type for given parcel (doesn't take dependencies into account).
 */
async function getMinReleaseTypeAsync(parcel: Parcel): Promise<ReleaseType> {
  const { logs, changelogChanges } = parcel.state;

  const unpublishedChanges = changelogChanges?.versions[Changelogs.UNPUBLISHED_VERSION_NAME];
  const hasBreakingChanges = unpublishedChanges?.[Changelogs.ChangeType.BREAKING_CHANGES]?.length;
  const hasNewFeatures = unpublishedChanges?.[Changelogs.ChangeType.NEW_FEATURES]?.length;

  // For breaking changes and new features we follow semver.
  if (hasBreakingChanges) {
    return ReleaseType.MAJOR;
  }
  if (hasNewFeatures) {
    return ReleaseType.MINOR;
  }

  // If the package is a native module, then we have to check whether there are any native changes.
  if (await parcel.pkg.isNativeModuleAsync()) {
    const hasNativeChanges = logs && fileLogsContainNativeChanges(logs.files);
    return hasNativeChanges ? ReleaseType.MINOR : ReleaseType.PATCH;
  }

  return ReleaseType.PATCH;
}

/**
 * Determines whether git file logs contain any changes in directories with native code.
 */
function fileLogsContainNativeChanges(fileLogs: GitFileLog[]): boolean {
  return fileLogs.some((fileLog) => {
    return NATIVE_DIRECTORIES.some((dir) => fileLog.relativePath.startsWith(`${dir}/`));
  });
}
