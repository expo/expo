import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import path from 'path';

import { EXPO_DIR } from '../../Constants';
import logger from '../../Logger';
import { DependencyKind } from '../../Packages';
import { getAvailableProjectTemplatesAsync } from '../../ProjectTemplates';
import { Task } from '../../TasksRunner';
import * as Workspace from '../../Workspace';
import { CommandOptions, Parcel, TaskArgs } from '../types';
import { updatePackageVersions } from './updatePackageVersions';

const { green, yellow, cyan } = chalk;

/**
 * Updates versions of packages to be published in other workspace projects depending on them.
 */
export const updateWorkspaceProjects = new Task<TaskArgs>(
  {
    name: 'updateWorkspaceProjects',
    dependsOn: [updatePackageVersions],
    filesToStage: ['**/package.json', 'pnpm-lock.yaml'],
  },
  async (parcels: Parcel[], options: CommandOptions) => {
    logger.info('\n📤 Updating workspace projects...');

    if (options.templatesOnly) {
      logger.info('  Skipping workspace updates (templates-only).');
      return;
    }

    const workspaceInfo = await Workspace.getInfoAsync();

    // Append project templates as they're not pnpm workspaces.
    const templates = await getAvailableProjectTemplatesAsync();
    templates.forEach((template) => {
      workspaceInfo[template.packageName] = {
        location: template.path.replace(EXPO_DIR, ''),
        workspaceDependencies: template
          .getDependencies([DependencyKind.Normal, DependencyKind.Dev])
          .map((dep) => dep.name),
        mismatchedWorkspaceDependencies: [],
        workspacePeerDependencies: [],
        mismatchedWorkspacePeerDependencies: [],
        workspaceOptionalDependencies: [],
      };
    });

    const dependenciesKeys = [
      'dependencies',
      'devDependencies',
      'peerDependencies',
      'optionalDependencies',
    ];

    const parcelsObject = parcels.reduce((acc, parcel) => {
      acc[parcel.pkg.packageName] = parcel;
      return acc;
    }, {});

    await Promise.all(
      Object.entries(workspaceInfo).map(async ([projectName, projectInfo]) => {
        const projectDependencies = [
          ...projectInfo.workspaceDependencies,
          ...projectInfo.workspacePeerDependencies,
          ...projectInfo.workspaceOptionalDependencies,
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

            if (
              !shouldUpdateDependencyVersion({
                currentVersionRange,
                dependencyType: dependenciesKey,
                isCanaryRelease: options.canary,
              })
            ) {
              continue;
            }

            // Normal releases preserve tilde/caret modifiers while replacing
            // embedded versions. Canary workspace ranges temporarily use bare
            // `workspace:` so pnpm resolves them to exact versions at pack time.
            const newVersionRange = resolveUpdatedDependencyVersionRange(
              currentVersionRange,
              state.releaseVersion!,
              options.canary
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

        // Flush batched logs if there is at least one version change in the project.
        if (batch.batchedLogs.length > 1) {
          batch.flush();
        }
      })
    );
  }
);

/**
 * Returns boolean indicating if the version range should be updated. We update them in most cases,
 * except for peer and optional dependencies with `*` range which are updated only for canary releases.
 *
 * @param context.currentVersionRange Current version range of the dependency
 * @param context.dependencyType What type of dependency we are updating
 * @param context.canary If this is a canary release
 */
export function shouldUpdateDependencyVersion(context: {
  currentVersionRange?: string;
  dependencyType: string;
  isCanaryRelease: boolean;
}) {
  // Do not update the version if there is no current version range
  if (!context.currentVersionRange) {
    return false;
  }

  if (context.currentVersionRange.startsWith('workspace:')) {
    const rest = context.currentVersionRange.slice('workspace:'.length);
    // NOTE(@kitten): Pinned versions (workspace:* and workspace:) never need updating.
    // pnpm updates these to exact versions.
    if (rest === '*' || rest === '') {
      return false;
    }

    // NOTE(@kitten): Shorthand versions (workspace:^ and workspace:~) need to be turned into
    // pinned versions for canary releases. pnpm updates these to exact versions.
    if (rest === '^' || rest === '~') {
      return context.isCanaryRelease;
    }

    return true;
  }

  // Only update the peerDependencies & optionalDependencies, where the version is `*`, during canary releases
  // Custom versioning like `x.x.x-canary-...` are NOT included when using `*` as version
  if (
    context.currentVersionRange === '*' &&
    ['peerDependencies', 'optionalDependencies'].includes(context.dependencyType)
  ) {
    return context.isCanaryRelease;
  }

  return true;
}

function resolveUpdatedDependencyVersionRange(
  currentVersionRange: string,
  releaseVersion: string,
  isCanaryRelease: boolean
): string {
  if (isCanaryRelease) {
    if (currentVersionRange.startsWith('workspace:')) {
      // NOTE(@kitten): Canary dependencies must be exact. Bare `workspace:` lets
      // pnpm resolve the dependency to its updated local canary version at pack time,
      // while avoiding duplicating version-resolution logic here
      return 'workspace:';
    }
    return releaseVersion;
  }

  if (currentVersionRange.startsWith('workspace:')) {
    return currentVersionRange.replace(/^workspace:([\^~]?).*/, `workspace:$1${releaseVersion}`);
  } else {
    return currentVersionRange.replace(/([\^~]?).*/, `$1${releaseVersion}`);
  }
}
