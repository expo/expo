import { AndroidProjectDependenciesUpdates } from './types';
import * as Changelogs from '../Changelogs';
import dependenciesChangelogs from '../data/androidDependenciesChangelogs.json';

function maybeWrapInChangelogLink(text: string, dependencyName: string) {
  const changelog = dependenciesChangelogs[dependencyName];
  return changelog ? `[${text}](${changelog})` : text;
}

export async function addChangelogEntries(
  updatesList: AndroidProjectDependenciesUpdates[]
): Promise<void> {
  await Promise.all(
    updatesList
      .filter((update) => update.updates.length > 0)
      .filter((update) => update.report.changelogPath)
      .map(async ({ updates, report }) => {
        const changelog = Changelogs.loadFrom(report.changelogPath!);

        const changelogEntries = updates.map(
          (update) =>
            `Updated Android native dependency: ${maybeWrapInChangelogLink(
              `\`${update.fullName}:${update.oldVersion}\` ➡️ \`${update.newVersion}\``,
              update.fullName
            )}`
        );
        await changelog.insertEntriesAsync(
          Changelogs.UNPUBLISHED_VERSION_NAME,
          Changelogs.ChangeType.LIBRARY_UPGRADES,
          null,
          changelogEntries
        );

        await changelog.saveAsync();
      })
  );
}
