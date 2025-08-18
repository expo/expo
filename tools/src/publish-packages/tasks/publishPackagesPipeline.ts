import chalk from 'chalk';

import { addPublishedLabelToPullRequests } from './addPublishedLabelToPullRequests';
import { addTemplateTarball } from './addTemplateTarball';
import { checkEnvironmentTask } from './checkEnvironmentTask';
import { checkPackagesIntegrity } from './checkPackagesIntegrity';
import { checkRepositoryStatus } from './checkRepositoryStatus';
// import { commentOnIssuesTask } from './commentOnIssuesTask';
import { commitStagedChanges } from './commitStagedChanges';
import { cutOffChangelogs } from './cutOffChangelogs';
import { grantTeamAccessToPackages } from './grantTeamAccessToPackages';
import { loadRequestedParcels } from './loadRequestedParcels';
import { publishAndroidArtifacts } from './publishAndroidPackages';
import { publishPackages } from './publishPackages';
import { pushCommittedChanges } from './pushCommittedChanges';
import { selectPackagesToPublish } from './selectPackagesToPublish';
import { updateAndroidProjects } from './updateAndroidProjects';
import { updateBundledNativeModulesFile } from './updateBundledNativeModulesFile';
import { updateIosProjects } from './updateIosProjects';
import { updateModuleTemplate } from './updateModuleTemplate';
import { updatePackageVersions } from './updatePackageVersions';
import { updateProjectTemplates } from './updateProjectTemplates';
import { updateWorkspaceProjects } from './updateWorkspaceProjects';
import Git from '../../Git';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { runWithSpinner } from '../../Utils';
import { CommandOptions, Parcel, TaskArgs } from '../types';

const { cyan, yellow } = chalk;

/**
 * Cleans up all the changes that were made by previously run tasks.
 */
const cleanWorkingTree = new Task<TaskArgs>(
  {
    name: 'cleanWorkingTree',
    dependsOn: [],
  },
  async () => {
    await runWithSpinner(
      'Cleaning up the working tree',
      async () => {
        // JSON files are automatically added to the index after previous tasks.
        await Git.checkoutAsync({
          ref: 'HEAD',
          paths: ['packages/**/expo-module.config.json'],
        });
        // Remove local repositories.
        await Git.cleanAsync({
          recursive: true,
          force: true,
          paths: ['packages/**/local-maven-repo/**'],
        });
        // Remove tarballs.
        await Git.cleanAsync({
          recursive: false,
          force: true,
          paths: ['packages/**/*.tgz', 'templates/**/*.tgz'],
        });
      },
      'Cleaned up the working tree'
    );
  }
);

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
      updateProjectTemplates,
      updateModuleTemplate,
      updateWorkspaceProjects,
      updateAndroidProjects,
      publishAndroidArtifacts,
      updateIosProjects,
      addTemplateTarball,
      cutOffChangelogs,
      commitStagedChanges,
      pushCommittedChanges,
      publishPackages,
      grantTeamAccessToPackages,
      addPublishedLabelToPullRequests,
      cleanWorkingTree,
      // commentOnIssuesTask,
    ],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    // If templates-only and nothing but templates are selected, skip Android/iOS project updates
    if (options.templatesOnly) {
      // Filter to templates-only parcels just to be explicit for downstream tasks if used elsewhere
      parcels = parcels.filter((p) => p.pkg.isTemplate());
    }
    const packagesCount = parcels.length;
    logger.success(
      `\n✅ Successfully published ${cyan.bold(packagesCount)} package${packagesCount > 1 ? 's' : ''}.\n`
    );

    if (options.tag !== 'latest') {
      logger.log(
        `Run ${cyan.bold('et promote-packages')} to promote them to ${yellow('latest')} tag.`
      );
    }
  }
);
