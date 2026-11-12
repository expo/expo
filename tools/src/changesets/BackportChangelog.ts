import { parseChangesetFile } from '@changesets/parse';
import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'tinyglobby';

import { ChangeType, Changelog, UNPUBLISHED_VERSION_NAME } from '../Changelogs';
import { isHeadingToken } from '../Markdown';
import { PACKAGE_GLOB_IGNORE, PACKAGE_JSON_GLOB, TEMPLATE_GLOB_IGNORE } from '../Packages';

type BumpType = ReturnType<typeof parseChangesetFile>['releases'][number]['type'];

const SECTION_BY_BUMP_TYPE: Record<BumpType, ChangeType> = {
  major: ChangeType.BREAKING_CHANGES,
  minor: ChangeType.NEW_FEATURES,
  patch: ChangeType.OTHERS,
  none: ChangeType.OTHERS,
};

/**
 * For a release branch without changesets: moves each changeset into an entry under
 * `## Unpublished` in the `CHANGELOG.md` of each package that it names, then deletes it. Paths are
 * relative to `repoDir`. Writes nothing when an entry cannot be added.
 */
export async function convertChangesetsAsync(
  repoDir: string,
  changesetPaths: readonly string[],
  pullRequest: { number: number; author: string }
): Promise<void> {
  const packageDirs = await readPackageDirsAsync(repoDir);
  const trailer = `([#${pullRequest.number}](https://github.com/expo/expo/pull/${pullRequest.number}) by [@${pullRequest.author}](https://github.com/${pullRequest.author}))`;
  const changelogs = new Map<string, Changelog>();

  for (const changesetPath of changesetPaths) {
    const { summary, releases } = parseChangesetFile(
      await fs.readFile(path.join(repoDir, changesetPath), 'utf8')
    );
    for (const { name, type } of releases) {
      const packageDir = packageDirs.get(name);
      if (!packageDir) {
        throw new Error(`${changesetPath} names "${name}", which is not a package on this branch.`);
      }
      const changelogPath = path.posix.join(packageDir, 'CHANGELOG.md');
      // Templates have no CHANGELOG.md on sdk-55 to sdk-57.
      if (!(await fs.stat(path.join(repoDir, changelogPath)).catch(() => null))) {
        continue;
      }
      const changelog =
        changelogs.get(changelogPath) ?? new Changelog(path.join(repoDir, changelogPath));
      changelogs.set(changelogPath, changelog);
      const tokens = await changelog.getTokensAsync();
      if (
        !tokens.some(
          (token) =>
            isHeadingToken(token) && token.depth === 2 && token.text === UNPUBLISHED_VERSION_NAME
        )
      ) {
        throw new Error(
          `${changelogPath} has no "## Unpublished" section, so ${changesetPath} cannot be added to it.`
        );
      }
      await changelog.insertEntriesAsync(
        UNPUBLISHED_VERSION_NAME,
        SECTION_BY_BUMP_TYPE[type],
        null,
        [formatEntry(summary, trailer)]
      );
    }
  }

  for (const changelog of changelogs.values()) {
    await changelog.saveAsync();
  }
  await Promise.all(
    changesetPaths.map((changesetPath) => fs.rm(path.join(repoDir, changesetPath)))
  );
}

/**
 * Indents the lines after the first so that they stay in the list item. The trailer goes on its own
 * line after a closing code fence, where it would otherwise be part of the fence.
 */
function formatEntry(summary: string, trailer: string): string {
  const lines = summary
    .trim()
    .split(/\r?\n/)
    .map((line, index) => (index === 0 || line.trim() === '' ? line : `  ${line}`));
  const last = lines[lines.length - 1].trim();
  return lines.length > 1 && /^(`{3,}|~{3,})$/.test(last)
    ? `${lines.join('\n')}\n\n  ${trailer}`
    : `${lines.join('\n')} ${trailer}`;
}

/** Maps each package name to its directory, with the globs of `getListOfPackagesAsync`. */
async function readPackageDirsAsync(repoDir: string): Promise<Map<string, string>> {
  const packageDirs = new Map<string, string>();
  for (const [root, ignore] of [
    ['packages', PACKAGE_GLOB_IGNORE],
    ['templates', TEMPLATE_GLOB_IGNORE],
  ] as const) {
    const cwd = path.join(repoDir, root);
    for (const file of await glob(PACKAGE_JSON_GLOB, { cwd, ignore, followSymbolicLinks: false })) {
      const { name } = JSON.parse(await fs.readFile(path.join(cwd, file), 'utf8'));
      packageDirs.set(name, path.posix.join(root, path.posix.dirname(file)));
    }
  }
  return packageDirs;
}
