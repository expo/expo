import JsonFile from '@expo/json-file';
import path from 'path';

import { EXPO_DIR, EXPO_GO_DIR } from './Constants';
import { DependencyKind, getPackageByName, Package } from './Packages';
import { spawnAsync, spawnJSONCommandAsync } from './Utils';

const NATIVE_APPS_PATHS = [EXPO_GO_DIR, path.join(EXPO_DIR, 'apps/bare-expo')];

/**
 * Workspace info for the single project.
 */
export type WorkspaceProjectInfo = {
  /** The relative location of the workspace within this monorepo */
  location: string;
  /** All `dependencies` or `devDependencies` that points to workspaces, but use a different version which is downloaded from npm */
  mismatchedWorkspaceDependencies: string[];
  /** All `dependencies` or `devDependencies` that points to other workspaces in this monorepo */
  workspaceDependencies: string[];
  /** All `peerDependencies` that points to other workspaces in this monorepo */
  workspacePeerDependencies: string[];
  /** All `optionalDependencies` that points to other workspaces in this monorepo */
  workspaceOptionalDependencies: string[];
};

/**
 * An object with workspace's projects info.
 */
export type WorkspacesInfo = Record<string, WorkspaceProjectInfo>;

/**
 * Returns an object containing info for all projects in the workspace.
 */
export async function getInfoAsync(): Promise<WorkspacesInfo> {
  // This only lists workspace dependencies from `dependencies` and `devDependencies`.
  const info = await spawnJSONCommandAsync<{ data: string }>('yarn', [
    '--json',
    'workspaces',
    'info',
  ]);

  const workspaces = JSON.parse(info.data) as WorkspacesInfo;

  for (const workspaceName in workspaces) {
    const workspace = workspaces[workspaceName];
    const workspacePackage = getPackageByName(workspaceName);

    if (!workspacePackage) {
      workspace.workspacePeerDependencies = [];
      workspace.workspaceOptionalDependencies = [];
      continue;
    }

    // Load all `peerDependencies` of the workspace
    workspace.workspacePeerDependencies = workspacePackage
      .getDependencies([DependencyKind.Peer])
      .filter((dependency) => !!workspaces[dependency.name])
      .map((dependency) => dependency.name);

    // Load all `optionalDependencies` of the workspace
    workspace.workspaceOptionalDependencies = workspacePackage
      .getDependencies([DependencyKind.Optional])
      .filter((dependency) => !!workspaces[dependency.name])
      .map((dependency) => dependency.name);
  }

  return workspaces;
}

/**
 * Runs yarn in the root workspace directory.
 */
export async function installAsync(): Promise<void> {
  await spawnAsync('yarn');
}

/**
 * Returns an array of workspace's native apps, like Expo Client or BareExpo.
 */
export function getNativeApps(): Package[] {
  return NATIVE_APPS_PATHS.map((appPath) => new Package(appPath));
}

/**
 * Updates the dependency across all workspace projects to given version range.
 */
export async function updateDependencyAsync(dependencyName: string, versionRange: string) {
  const projectLocations = Object.values(await getInfoAsync()).map(
    (projectInfo) => projectInfo.location
  );

  await Promise.all(
    projectLocations.map(async (location) => {
      const jsonFile = new JsonFile(path.join(EXPO_DIR, location, 'package.json'));
      const packageJson = await jsonFile.readAsync();

      for (const dependencyType of ['dependencies', 'devDependencies', 'peerDependencies']) {
        const dependencies = packageJson[dependencyType];
        const currentVersion = dependencies?.[dependencyName];

        if (dependencies && currentVersion && currentVersion !== '*') {
          dependencies[dependencyName] = versionRange;
        }
      }
      await jsonFile.writeAsync(packageJson);
    })
  );
}
