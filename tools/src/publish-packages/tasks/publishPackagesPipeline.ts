import chalk from 'chalk';

import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { checkPackagesIntegrity } from './checkPackagesIntegrity';
import { checkRepositoryStatus } from './checkRepositoryStatus';
import { cleanPrebuildsTask } from './cleanPrebuildsTask';
import { commentOnIssuesTask } from './commentOnIssuesTask';
import { commitStagedChanges } from './commitStagedChanges';
import { cutOffChangelogs } from './cutOffChangelogs';
import { grantTeamAccessToPackages } from './grantTeamAccessToPackages';
import { prebuildPackagesTask } from './prebuildPackagesTask';
import { prepareParcels } from './prepareParcels';
import { publishPackages } from './publishPackages';
import { pushCommittedChanges } from './pushCommittedChanges';
import { selectPackagesToPublish } from './selectPackagesToPublish';
import { updateAndroidProjects } from './updateAndroidProjects';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateIosProjects } from './updateIosProjects';
import { updatePackageVersions } from './updatePackageVersions';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';

const { cyan, yellow } = chalk;

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
      updatePackageVersions,
      updateBundledNativeModulesFile,
      updateWorkspaceProjects,
      updateAndroidProjects,
      updateIosProjects,
      cutOffChangelogs,
      commitStagedChanges,
      pushCommittedChanges,
      prebuildPackagesTask,
      publishPackages,
      cleanPrebuildsTask,
      grantTeamAccessToPackages,
      commentOnIssuesTask,
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
