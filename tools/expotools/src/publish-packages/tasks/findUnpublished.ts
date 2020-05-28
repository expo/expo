import * as Changelogs from '../../Changelogs';
import { GitDirectory, GitFileLog } from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { filterAsync } from '../../Utils';
import { prepareParcels } from './prepareParcels';
import { CommandOptions, Parcel, PackageGitLogs, TaskArgs, ReleaseType } from '../types';

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
 * Gets lists of commits and files changed under given directory and since commit with given checksum.
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
    toCommit: 'head',
  });

  const files = await gitDir.logFilesAsync({
    fromCommit: commits[commits.length - 1]?.hash,
    toCommit: commits[0]?.hash,
  });

  return {
    commits,
    files,
  };
}

/**
 * Returns minimum release type for given parcel (doesn't take dependencies into account).
 */
function getMinReleaseType(parcel: Parcel): ReleaseType {
  const { logs, changelogChanges } = parcel.state;

  const unpublishedChanges = changelogChanges?.versions[Changelogs.UNPUBLISHED_VERSION_NAME];
  const hasBreakingChanges = unpublishedChanges?.[Changelogs.ChangeType.BREAKING_CHANGES]?.length;
  const hasNativeChanges = logs && fileLogsContainNativeChanges(logs.files);

  const releaseType = hasBreakingChanges
    ? ReleaseType.MAJOR
    : hasNativeChanges
    ? ReleaseType.MINOR
    : ReleaseType.PATCH;

  return releaseType;
}

/**
 * Determines whether git file logs contain any changes in directories with native code.
 */
function fileLogsContainNativeChanges(fileLogs: GitFileLog[]): boolean {
  return fileLogs.some((fileLog) => {
    return NATIVE_DIRECTORIES.some((dir) => fileLog.relativePath.startsWith(`${dir}/`));
  });
}
