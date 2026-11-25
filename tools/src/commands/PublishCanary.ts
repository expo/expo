import { Command } from '@expo/commander';

import { runCanaryAsync } from '../changesets/Canary';
import {
  assertChangesetPrerequisiteAsync,
  assertCleanWorkingTreeAsync,
  assertNoMajorChangesetsAsync,
  assertReleaseBranch,
  getReleaseBranchAsync,
} from '../changesets/Changesets';
import { runPackagePreviewAsync } from '../changesets/PackagePreview';

type CommandOptions = {
  dryRun: boolean;
  force: boolean;
  package?: string;
  sdk?: string;
  build: string;
  use: string;
  packDir?: string;
};

// Accepts commas or whitespace, so a workflow can pass an empty input.
const list = (value: string) => value.split(/[\s,]+/).filter(Boolean);

export default (program: Command) => {
  program
    .command('publish-canary')
    .option(
      '-f, --force',
      'Publish without pending changeset entries. Other release safeguards are not bypassed.',
      false
    )
    .option('--dry-run', 'Prepare the complete canary without publishing it to npm.', false)
    .option('--package <name>', 'Publish a preview of only this package and its dependencies.')
    .option('--sdk <major>', 'Target Expo SDK major version of the preview.')
    .option('--build <names>', 'Dependencies to preview from this checkout as well.', '')
    .option('--use <specs>', 'Exact published versions of dependencies, as <name>@<version>.', '')
    .option('--pack-dir <dir>', 'Keep the packed preview and its selection report here.')
    .description('Publish all public packages as a Changesets canary snapshot.')
    .asyncAction(async (options: CommandOptions) => {
      const branchName = await getReleaseBranchAsync();
      await assertReleaseBranch(branchName, 'canary');
      await assertCleanWorkingTreeAsync();
      // An empty `--package` from a blank workflow input must never fall through to a full canary.
      if (options.package !== undefined) {
        const sdk = Number(options.sdk);
        if (!Number.isInteger(sdk) || sdk <= 0) {
          throw new Error('A package preview requires --sdk with an Expo SDK major version.');
        }
        await runPackagePreviewAsync({
          rootName: options.package,
          sdk,
          build: list(options.build),
          use: list(options.use),
          branchName,
          dryRun: options.dryRun,
          packDir: options.packDir,
        });
        return;
      }
      if (options.sdk || options.build || options.use || options.packDir) {
        throw new Error('--sdk, --build, --use and --pack-dir require --package.');
      }
      const changesets = await assertChangesetPrerequisiteAsync('present', options.force);
      await assertNoMajorChangesetsAsync(changesets, branchName);
      await runCanaryAsync({ branchName, dryRun: options.dryRun });
    });
};
