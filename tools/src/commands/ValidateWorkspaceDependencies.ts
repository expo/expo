import { Command } from '@expo/commander';
import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';
import { getInfoAsync } from '../Workspace';

export default (program: Command) => {
  program
    .command('validate-workspace-dependencies')
    .alias('vwd')
    .description('Verifies if all workspace packages are linked from monorepo.')
    .asyncAction(actionAsync);
};

async function actionAsync() {
  const workspacePackages = await getWorkspacePackagesAsync();

  const workspacesMismatched = Object.values(workspacePackages).filter(
    (workspace) => workspace.mismatchedWorkspaceDependencies.length
  );
  const workspacesWithMismatchedPeers = Object.values(workspacePackages).filter(
    (workspace) => workspace.mismatchedWorkspacePeerDependencies.length
  );

  if (!workspacesMismatched.length && !workspacesWithMismatchedPeers.length) {
    console.log(
      `✅  Verified that all workspace packages are symlinked and peer pins are in sync.`
    );
    return;
  }

  if (workspacesMismatched.length) {
    console.warn(
      workspacesMismatched.length === 1
        ? `⚠️  Found 1 workspace package installed from npm instead of this repository.`
        : `⚠️  Found ${workspacesMismatched.length} workspace packages installed from npm instead of this repository.`
    );

    for (const workspace of workspacesMismatched) {
      const mismatched = workspace.mismatchedWorkspaceDependencies;

      console.warn();
      console.warn(
        mismatched.length === 1
          ? `${workspace._name} has 1 workspace package that isn't symlinked:`
          : `${workspace._name} has ${mismatched.length} workspace packages that aren't symlinked:`
      );

      for (const dependency of mismatched) {
        const workspaceVersion = workspacePackages[dependency]._version;
        const installedVersion = await getResolvedVersionAsync(workspace._directory, dependency);

        console.warn(
          `- ${dependency}@${installedVersion} is installed, but workspace package is at ${workspaceVersion}`
        );
      }
    }
  }

  if (workspacesWithMismatchedPeers.length) {
    console.warn();
    console.warn(
      workspacesWithMismatchedPeers.length === 1
        ? `⚠️  Found 1 workspace package with a stale peerDependency pin to another workspace package.`
        : `⚠️  Found ${workspacesWithMismatchedPeers.length} workspace packages with stale peerDependency pins to other workspace packages.`
    );
    console.warn(
      `   These pins ship to npm verbatim. After a peer's version bumps past the pinned range, every install of these packages emits "incorrect peer dependency" warnings until the dependent is republished.`
    );

    for (const workspace of workspacesWithMismatchedPeers) {
      const mismatched = workspace.mismatchedWorkspacePeerDependencies;
      const declaredPeers =
        (require(path.join(workspace._directory, 'package.json')).peerDependencies as
          | Record<string, string>
          | undefined) ?? {};

      console.warn();
      console.warn(
        mismatched.length === 1
          ? `${workspace._name} has 1 stale peer pin:`
          : `${workspace._name} has ${mismatched.length} stale peer pins:`
      );

      for (const dependency of mismatched) {
        const peerVersion = workspacePackages[dependency]._version;
        const declaredRange = declaredPeers[dependency];

        console.warn(
          `- peerDependencies.${dependency} declares "${declaredRange}", but workspace ${dependency} is at ${peerVersion}`
        );
      }
    }
  }

  process.exit(1);
}

async function getWorkspacePackagesAsync() {
  const root = getExpoRepositoryRootDir();
  const workspaces = await getInfoAsync();

  return Object.fromEntries(
    Object.entries(workspaces).map(([_name, workspace]) => {
      const _directory = path.join(root, workspace.location);
      const _version = require(path.join(_directory, 'package.json')).version;

      return [_name, { _name, _version, _directory, ...workspace }];
    })
  );
}

async function getResolvedVersionAsync(directory: string, packageName: string) {
  const packageFile = require.resolve(`${packageName}/package.json`, { paths: [directory] });
  return require(packageFile).version;
}
