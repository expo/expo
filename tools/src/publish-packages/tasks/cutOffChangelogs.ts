import chalk from 'chalk';

import { selectPackagesToPublish } from './selectPackagesToPublish';
import { VERSION_EMPTY_PARAGRAPH_TEXT } from '../../Changelogs';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { Parcel, TaskArgs } from '../types';

const { green, gray } = chalk;

/**
 * Cuts off changelogs - renames unpublished section header
 * to the new version and adds new unpublished section on top.
 */
export const cutOffChangelogs = new Task<TaskArgs>(
  {
    name: 'cutOffChangelogs',
    dependsOn: [selectPackagesToPublish],
    filesToStage: ['packages/**/CHANGELOG.md'],
  },
  async (parcels: Parcel[]) => {
    logger.info('\n✂️  Cutting off changelogs...');

    await Promise.all(
      parcels.map(async (parcel) => {
        const {
          pkg,
          changelog,
          state: { releaseVersion },
          logs,
        } = parcel;
        if (!releaseVersion) {
          return;
        }
        const changes = await parcel.changelog.getChangesAsync('10.1.2');

        const commitsSummary =
          logs?.commits
            .map(
              (commit) => `- [${commit.title}](https://github.com/expo/expo/commit/${commit.hash})`
            )
            .join('\n') ?? 'No commits found';
        const expandableSection = `<details>
<summary>Changes from the following commits are part of this release:</summary>

${commitsSummary}

</details>\n`;

        const notes = VERSION_EMPTY_PARAGRAPH_TEXT + '\n\n' + expandableSection;
        logger.log({
          pkg: pkg.packageName,
          logs: JSON.stringify(logs, null, 2),
          changes: JSON.stringify(changes, null, 2),
          notes,
        });

        let skipReason = '';

        if (await changelog.fileExistsAsync()) {
          const versions = await changelog.getVersionsAsync();

          // This prevents unnecessary cut-offs when that version was already cutted off.
          // Maybe we should move "unpublished" entries to this version? It's probably too rare to worry about it.
          if (!versions.includes(releaseVersion)) {
            logger.log('  ', green(pkg.packageName) + '...');
            await changelog.cutOffAsync(releaseVersion, notes);
            await changelog.saveAsync();
            return;
          }
          skipReason = 'version already exists';
        } else {
          skipReason = 'no changelog file';
        }
        logger.log('  ', green(pkg.packageName), gray(`- skipped, ${skipReason}`));
      })
    );
  }
);
