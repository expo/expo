import { Command } from '@expo/commander';
import JsonFile from '@expo/json-file';
import chalk from 'chalk';
import inquirer from 'inquirer';
import nullthrows from 'nullthrows';
import path from 'path';
import semver from 'semver';

import {
  Changelog,
  ChangelogChanges,
  ChangelogEntry,
  ChangeType,
  UNPUBLISHED_VERSION_NAME,
} from '../Changelogs';
import { EXPO_DIR } from '../Constants';
import { stripNonAsciiChars, formatChangelogEntry } from '../Formatter';
import logger from '../Logger';
import { getListOfPackagesAsync, Package } from '../Packages';
import { filterAsync } from '../Utils';

const MAIN_CHANGELOG_PATH = path.join(EXPO_DIR, 'CHANGELOG.md');
const VERSIONS_FILE_PATH = path.join(EXPO_DIR, 'changelogVersions.json');

type CommandOptions = {
  cutOff: boolean;
};

type ChangesMap = Map<Package, ChangelogChanges['versions']>;
type ChangelogVersions = Record<string, Record<string, string>>;

export default (program: Command) => {
  program
    .command('merge-changelogs')
    .alias('mc')
    .description('Merges packages changelogs into the root one.')
    .option(
      '-c, --cut-off',
      'Whether to cut off SDK changelog after merging. Works only without --sdk flag.'
    )
    .asyncAction(async (options: CommandOptions) => {
      const mainChangelog = new Changelog(MAIN_CHANGELOG_PATH);
      const changesMap: ChangesMap = new Map();
      const versions = await JsonFile.readAsync<ChangelogVersions>(VERSIONS_FILE_PATH);
      const previousVersion = await mainChangelog.getLastPublishedVersionAsync();
      const nextVersion = nullthrows(semver.inc(nullthrows(previousVersion), 'major'));

      if (!previousVersion) {
        throw new Error('Cannot find last published version in SDK changelog.');
      }

      // Versions object will be used to do cut-off. Make a new field for the next SDK in advance.
      versions[nextVersion] = { ...versions[previousVersion] };

      logger.info('\n🤏 Getting a list of packages...');

      // Get public packages that are not explicitly set to `null` in `changelogVersions.json`.
      const packages = await filterAsync(await getListOfPackagesAsync(), async (pkg) => {
        return (
          !pkg.packageJson.private &&
          versions[previousVersion]?.[pkg.packageName] !== null &&
          (await pkg.hasChangelogAsync())
        );
      });

      // Load changes into `changesMap`.
      await getChangesFromPackagesAsync(packages, changesMap, versions, previousVersion);

      // Insert entries for packages not bundled in previous SDK.
      await insertInitialReleasesAsync(
        mainChangelog,
        changesMap,
        versions,
        previousVersion,
        nextVersion
      );

      // Insert updates from previously bundled packages.
      await insertNewChangelogEntriesAsync(
        mainChangelog,
        changesMap,
        versions,
        previousVersion,
        nextVersion
      );

      if (options.cutOff) {
        await cutOffMainChangelogAsync(mainChangelog, versions, nextVersion);
      }

      logger.info('\n💾 Saving SDK changelog...');

      await mainChangelog.saveAsync();

      logger.success('\n✅ Successfully merged changelog entries.');
    });
};

/**
 * Gets changes in packages changelogs as of the version bundled in previous SDK version.
 */
async function getChangesFromPackagesAsync(
  packages: Package[],
  changesMap: ChangesMap,
  versions: ChangelogVersions,
  previousVersion: string
): Promise<void> {
  logger.info('\n🔍 Gathering changelog entries from packages...');

  await Promise.all(
    packages.map(async (pkg) => {
      const changelog = new Changelog(pkg.changelogPath);
      const fromVersion = versions[previousVersion]?.[pkg.packageName];
      const changes = await changelog.getChangesAsync(fromVersion);

      if (changes.totalCount > 0) {
        changesMap.set(pkg, changes.versions);
      }
    })
  );
}

/**
 * Inserts initial package releases at the beginning of new features.
 */
async function insertInitialReleasesAsync(
  mainChangelog: Changelog,
  changesMap: ChangesMap,
  versions: ChangelogVersions,
  previousVersion: string,
  nextVersion: string
): Promise<void> {
  for (const pkg of changesMap.keys()) {
    // Get version of the package in previous SDK.
    const fromVersion = versions[previousVersion]?.[pkg.packageName];

    // The package wasn't bundled in SDK yet.
    if (!fromVersion) {
      // Delete the package from the map, no need to handle them again in further functions.
      changesMap.delete(pkg);

      if (!(await promptToMakeInitialReleaseAsync(pkg.packageName))) {
        continue;
      }

      // Update versions object with the local version.
      versions[nextVersion][pkg.packageName] = pkg.packageVersion;

      // Unshift initial release entry instead of grouped entries.
      await mainChangelog.insertEntriesAsync(
        UNPUBLISHED_VERSION_NAME,
        ChangeType.NEW_FEATURES,
        null,
        [`Initial release of **\`${pkg.packageName}\`** 🥳`],
        {
          unshift: true,
        }
      );
      logger.info(`\n📦 Inserted initial release of ${chalk.green(pkg.packageName)}`);
    }
  }
}

/**
 * Inserts new changelog entries made as of previous SDK.
 */
async function insertNewChangelogEntriesAsync(
  mainChangelog: Changelog,
  changesMap: ChangesMap,
  versions: ChangelogVersions,
  previousVersion: string,
  nextVersion: string
): Promise<void> {
  for (const [pkg, changes] of changesMap) {
    // Sort versions so we keep the order of changelog entries from oldest to newest.
    const packageVersions = Object.keys(changes).sort(sortVersionsAsc);

    // Get version of the package in previous SDK.
    const fromVersion = versions[previousVersion]?.[pkg.packageName];

    // Update versions object with the local version.
    versions[nextVersion][pkg.packageName] = pkg.packageVersion;

    const insertedEntries: Record<string, ChangelogEntry[]> = {};
    let entriesCount = 0;

    for (const packageVersion of packageVersions) {
      for (const type in changes[packageVersion]) {
        const entries = await mainChangelog.insertEntriesAsync(
          UNPUBLISHED_VERSION_NAME,
          type,
          pkg.packageName,
          changes[packageVersion][type]
        );

        if (entries.length > 0) {
          insertedEntries[type] = entries;
          entriesCount += entries.length;
        }
      }
    }

    if (entriesCount === 0) {
      continue;
    }

    // Package was already bundled within previous version.
    logger.info(
      `\n📦 Inserted ${chalk.green(pkg.packageName)} entries as of ${chalk.yellow(fromVersion)}`
    );

    for (const [type, entries] of Object.entries(insertedEntries)) {
      logger.log('  ', chalk.magenta(stripNonAsciiChars(type).trim() + ':'));
      entries.forEach((entry) => {
        logger.log('    ', formatChangelogEntry(entry.message));
      });
    }
  }
}

/**
 * Cuts off changelog for the new SDK and updates file with changelog versions.
 */
async function cutOffMainChangelogAsync(
  mainChangelog: Changelog,
  versions: ChangelogVersions,
  nextVersion: string
): Promise<void> {
  logger.info(`\n✂️  Cutting off changelog for SDK ${chalk.cyan(nextVersion)}...`);

  await mainChangelog.cutOffAsync(nextVersion, [
    ChangeType.LIBRARY_UPGRADES,
    ChangeType.BREAKING_CHANGES,
    ChangeType.NEW_FEATURES,
    ChangeType.BUG_FIXES,
  ]);

  logger.info('\n💾 Saving new changelog versions...');

  // Create a new versions object with keys in descending order.
  const newVersions = Object.keys(versions)
    .sort((a, b) => sortVersionsAsc(b, a))
    .reduce((acc, version) => {
      acc[version] = versions[version];
      return acc;
    }, {});

  // Update `changelogVersions.json` with keys being sorted in descending order.
  await JsonFile.writeAsync(VERSIONS_FILE_PATH, newVersions);
}

/**
 * Comparator that sorts versions in ascending order with unpublished version being the last.
 */
function sortVersionsAsc(a: string, b: string): number {
  return a === UNPUBLISHED_VERSION_NAME
    ? 1
    : b === UNPUBLISHED_VERSION_NAME
      ? -1
      : semver.compare(a, b);
}

/**
 * Prompts the user whether to make initial release of given package.
 */
async function promptToMakeInitialReleaseAsync(packageName: string): Promise<boolean> {
  logger.log();
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      default: true,
      prefix: '❔',
      message: `${chalk.green(packageName)} wasn't bundled in SDK yet. Do you want to include it?`,
    },
  ]);
  return confirm;
}
