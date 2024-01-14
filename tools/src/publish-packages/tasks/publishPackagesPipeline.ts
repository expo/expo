import chalk from 'chalk';

import { addPublishedLabelToPullRequests } from './addPublishedLabelToPullRequests';
import { checkEnvironmentTask } from './checkEnvironmentTask';
import { checkPackagesIntegrity } from './checkPackagesIntegrity';
import { checkRepositoryStatus } from './checkRepositoryStatus';
// import { commentOnIssuesTask } from './commentOnIssuesTask';
import { commitStagedChanges } from './commitStagedChanges';
import { cutOffChangelogs } from './cutOffChangelogs';
import { grantTeamAccessToPackages } from './grantTeamAccessToPackages';
import { loadRequestedParcels } from './loadRequestedParcels';
import { publishPackages } from './publishPackages';
import { pushCommittedChanges } from './pushCommittedChanges';
import { selectPackagesToPublish } from './selectPackagesToPublish';
import { updateAndroidProjects } from './updateAndroidProjects';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateIosProjects } from './updateIosProjects';
import { updateModuleTemplate } from './updateModuleTemplate';
import { updatePackageVersions } from './updatePackageVersions';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan, yellow } = chalk;

/**
 * Pipeline with a bunch of tasks required to publish packages.
 */
export const publishPackagesPipeline = new Task<TaskArgs>(
  {
    name: 'publishPackagesPipeline',
    dependsOn: [
      checkEnvironmentTask,
      checkRepositoryStatus,
      loadRequestedParcels,
      checkPackagesIntegrity,
      selectPackagesToPublish,
      updatePackageVersions,
      updateBundledNativeModulesFile,
      updateModuleTemplate,
      updateWorkspaceProjects,
      updateAndroidProjects,
      updateIosProjects,
      cutOffChangelogs,
      commitStagedChanges,
      pushCommittedChanges,
      publishPackages,
      grantTeamAccessToPackages,
      addPublishedLabelToPullRequests,
      // commentOnIssuesTask,
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
