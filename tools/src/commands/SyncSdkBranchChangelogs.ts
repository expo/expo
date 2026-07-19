import { Command } from '@expo/commander';
import chalk from 'chalk';
import semver from 'semver';

import { Changelog, MemChangelog, UNPUBLISHED_VERSION_NAME } from '../Changelogs';
import Git from '../Git';
import { Package, getListOfPackagesAsync } from '../Packages';
import { filterAsync } from '../Utils';

type CommandOptions = {
  branch: string;
};

export default (program: Command) => {
  program
    .command('sync-sdk-branch-changelogs')
    .alias('ssbc')
    .description('Sync packages changelogs from sdk branch to current branch.')
    .option('-b, --branch <name>', 'Source branch name')
    .asyncAction(async (options: CommandOptions) => {
      if (!options.branch) {
        throw new Error(
          'Missing branch name. Run with `--branch <name>` to specify source branch.'
        );
      }

      console.log('\u203A Fetching git changes');
      await Git.fetchAsync();
      console.log('');

      const packages = await getPackagesWithChangelogAsync();

      for (const pkg of packages) {
        let changed = false;
        try {
          changed = await syncChangelogAsync(pkg, options.branch);
        } catch (e) {
          const errorMessage = e.message ?? String(e);
          console.error(`❌ ${chalk.red(pkg.packageName)}: ${errorMessage}`);
        }
        if (changed) {
          console.log(`✅ ${pkg.packageName}`);
        }
      }
    });
};

/**
 * Gets packages with a changelog file.
 */
async function getPackagesWithChangelogAsync(): Promise<Package[]> {
  const packages = await getListOfPackagesAsync();
  return filterAsync(packages, (pkg) => pkg.hasChangelogAsync());
}

/**
 * Syncs changelog of a package from `sourceBranch` to current branch
 */
async function syncChangelogAsync(pkg: Package, sourceBranch: string) {
  const sourceChangelog = new MemChangelog(
    await Git.readFileAsync(`origin/${sourceBranch}`, pkg.changelogPath)
  );
  const targetChangelog = new Changelog(pkg.changelogPath);

  const sourceLastVersion = await sourceChangelog.getLastPublishedVersionAsync();
  const targetLastVersion = await targetChangelog.getLastPublishedVersionAsync();
  if (!sourceLastVersion || !targetLastVersion) {
    throw new Error('Cannot determine latest published version');
  }

  if (semver.gt(targetLastVersion, sourceLastVersion)) {
    throw new Error(
      'Current version is newer than source branch and there might be some inconsistency in between, e.g. canary version published. Please update manually.'
    );
  } else if (semver.eq(sourceLastVersion, targetLastVersion)) {
    return false;
  }

  const changes = await sourceChangelog.getChangesAsync(targetLastVersion, sourceLastVersion);

  delete changes.versions[UNPUBLISHED_VERSION_NAME];
  let updated = false;
  for (const version of Object.keys(changes.versions).sort((v1, v2) =>
    semver.gt(v1, v2) ? 1 : -1
  )) {
    const groupData = changes.versions[version];
    if (Object.keys(groupData).length === 0) {
      const result = await targetChangelog.insertEmptyPublishedVersionAsync(
        version,
        changes.versionDateMap[version]
      );
      updated ||= result;
      continue;
    }

    for (const [changeType, entries] of Object.entries(groupData)) {
      for (const entry of entries) {
        const result = await targetChangelog.moveEntryBetweenVersionsAsync(
          entry,
          changeType,
          UNPUBLISHED_VERSION_NAME,
          version,
          changes.versionDateMap[version]
        );
        updated ||= result;
      }
    }
  }
  if (updated) {
    await targetChangelog.saveAsync();
  }

  return true;
}
