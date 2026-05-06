import JsonFile from '@expo/json-file';
import path from 'path';
import * as semver from 'semver';

import { EXPO_DIR, EXPO_GO_DIR } from './Constants';
import { DependencyKind, Package, PackageJson } from './Packages';
import { spawnAsync, spawnJSONCommandAsync } from './Utils';

const NATIVE_APPS_PATHS = [EXPO_GO_DIR, path.join(EXPO_DIR, 'apps/bare-expo')];

/**
 * Workspace info for the single project.
 */
export type WorkspaceProjectInfo = {
  /** The relative location of the workspace within this monorepo */
  location: string;
  /** All `dependencies` or `devDependencies` that point to workspaces but use a version range that does not satisfy the local workspace package's version */
  mismatchedWorkspaceDependencies: string[];
  /** All `dependencies` or `devDependencies` that point to other workspaces in this monorepo */
  workspaceDependencies: string[];
  /** All `peerDependencies` that point to other workspaces in this monorepo */
  workspacePeerDependencies: string[];
  /** Subset of `workspacePeerDependencies` where the declared peer range does not satisfy the local workspace package's version. Catches peer pins that have drifted past a peer's published version (e.g. `peer.expo: "56.0.0-preview.1"` after `expo` bumped to `56.0.0-preview.2`). */
  mismatchedWorkspacePeerDependencies: string[];
  /** All `optionalDependencies` that point to other workspaces in this monorepo */
  workspaceOptionalDependencies: string[];
};

/**
 * An object with workspace's projects info.
 */
export type WorkspacesInfo = Record<string, WorkspaceProjectInfo>;

type PnpmProjectListing = {
  name?: string;
  version?: string;
  path: string;
  private?: boolean;
};

/**
 * Returns an object containing info for all projects in the workspace.
 */
export async function getInfoAsync(): Promise<WorkspacesInfo> {
  const projects = await listWorkspaceProjectsAsync();
  const packages = projects
    .filter((project) => path.resolve(project.path) !== path.resolve(EXPO_DIR))
    .map((project) => {
      const packageJsonPath = path.join(project.path, 'package.json');
      const packageJson = require(packageJsonPath) as PackageJson;
      return new Package(project.path, packageJson);
    })
    .filter((pkg) => !!pkg.packageName);

  return buildWorkspacesInfo(packages);
}

export function buildWorkspacesInfo(packages: Package[]): WorkspacesInfo {
  const packagesByName = new Map<string, Package>();
  for (const pkg of packages) {
    packagesByName.set(pkg.packageName, pkg);
  }

  const result: WorkspacesInfo = {};
  for (const pkg of packages) {
    result[pkg.packageName] = {
      location: path.relative(EXPO_DIR, pkg.path),
      ...classifyDependencies(pkg, packagesByName),
    };
  }
  return result;
}

function classifyDependencies(pkg: Package, byName: Map<string, Package>) {
  const workspaceDependencies: string[] = [];
  const mismatchedWorkspaceDependencies: string[] = [];

  for (const dep of pkg.getDependencies([DependencyKind.Normal, DependencyKind.Dev])) {
    const target = byName.get(dep.name);
    if (!target) continue;
    if (rangeSatisfies(dep.versionRange, target.packageJson.version)) {
      workspaceDependencies.push(dep.name);
    } else {
      mismatchedWorkspaceDependencies.push(dep.name);
    }
  }

  const workspacePeerDependencies: string[] = [];
  const mismatchedWorkspacePeerDependencies: string[] = [];
  for (const dep of pkg.getDependencies([DependencyKind.Peer])) {
    const target = byName.get(dep.name);
    if (!target) continue;
    workspacePeerDependencies.push(dep.name);
    if (!rangeSatisfies(dep.versionRange, target.packageJson.version)) {
      mismatchedWorkspacePeerDependencies.push(dep.name);
    }
  }

  const workspaceOptionalDependencies = pkg
    .getDependencies([DependencyKind.Optional])
    .filter((dep) => byName.has(dep.name))
    .map((dep) => dep.name);

  return {
    workspaceDependencies,
    mismatchedWorkspaceDependencies,
    workspacePeerDependencies,
    mismatchedWorkspacePeerDependencies,
    workspaceOptionalDependencies,
  };
}

/**
 * Whether a dependency's declared range will resolve to the local workspace
 * package's version. The pnpm `workspace:` protocol always links locally, so
 * any `workspace:*`/`workspace:^`/etc. counts as a match regardless of the
 * embedded range.
 */
function rangeSatisfies(range: string, version: string): boolean {
  if (range.startsWith('workspace:')) {
    return true;
  }
  try {
    return semver.satisfies(version, range, { includePrerelease: true });
  } catch {
    return false;
  }
}

async function listWorkspaceProjectsAsync(): Promise<PnpmProjectListing[]> {
  return await spawnJSONCommandAsync<PnpmProjectListing[]>('pnpm', [
    '-r',
    '--depth=-1',
    'ls',
    '--json',
  ]);
}

/**
 * Runs `pnpm install` in the root workspace directory.
 */
export async function installAsync(): Promise<void> {
  await spawnAsync('pnpm', ['install']);
}

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
