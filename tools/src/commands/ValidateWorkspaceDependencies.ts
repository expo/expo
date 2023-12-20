import { Command } from '@expo/commander';
import path from 'path';

import { getExpoRepositoryRootDir } from '../Directories';
import { getInfoAsync } from '../Workspace';

type ActionOptions = {
  workspace?: string;
};

export default (program: Command) => {
  program
    .command('validate-workspace-dependencies')
    .alias('vwd')
    .description('Verifies if all workspaces are linked from monorepo.')
    .asyncAction(action);
};

async function action(options: ActionOptions) {
  const workspaces = await getWorkspacesAsync();
  const workspacesMismatched = Object.values(workspaces).filter(
    (workspace) => workspace.mismatchedWorkspaceDependencies.length
  );

  if (!workspacesMismatched.length) {
    return console.log(`✅  Verified that all workspace dependencies are symlinked.`);
  }

  console.warn(
    workspacesMismatched.length === 1
      ? `⚠️  Found 1 workspace installed from npm instead of this repository.`
      : `⚠️  Found ${workspacesMismatched.length} workspaces installed from npm instead of this repository.`
  );

  for (const workspace of workspacesMismatched) {
    const mismatched = workspace.mismatchedWorkspaceDependencies;

    console.warn();
    console.warn(
      mismatched.length === 1
        ? `${workspace._name} has 1 workspace that isn't symlinked:`
        : `${workspace._name} has ${mismatched.length} workspace that aren't symlinked:`
    );

    for (const dependency of mismatched) {
      const workspaceVersion = workspaces[dependency]._package.version;
      const installedVersion = await getResolvedVersionAsync(workspace._directory, dependency);

      console.warn(
        `- ${dependency}@${installedVersion} is installed, but workspace is at ${workspaceVersion}`
      );
    }
  }

  process.exit(1);
}

async function getWorkspacesAsync() {
  const root = getExpoRepositoryRootDir();
  const workspaces = await getInfoAsync();

  return Object.fromEntries(
    Object.entries(workspaces).map(([_name, workspace]) => {
      const _directory = path.join(root, workspace.location);
      const _package = require(path.join(_directory, 'package.json'));

      return [_name, { _name, _package, _directory, ...workspace }];
    })
  );
}

async function getResolvedVersionAsync(directory: string, packageName: string) {
  const packageFile = require.resolve(`${packageName}/package.json`, { paths: [directory] });
  return require(packageFile).version;
}
