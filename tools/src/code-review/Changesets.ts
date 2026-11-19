import { parseChangesetFile } from '@changesets/parse';
import path from 'node:path';

import { EXPO_DIR } from '../Constants';
import Git, { GitFileDiff } from '../Git';
import { PullRequest } from '../GitHub';

export type ChangedChangeset = {
  path: string;
  changeset?: ReturnType<typeof parseChangesetFile>;
  error?: string;
};

export function isChangesetPath(filePath: string): boolean {
  return /^\.changeset\/[^/]+\.md$/.test(filePath) && filePath !== '.changeset/README.md';
}

export async function readChangedChangesetsAsync(
  pullRequest: PullRequest,
  diff: GitFileDiff[]
): Promise<ChangedChangeset[]> {
  const paths = diff
    .filter((file) => !file.deleted)
    .map((file) => path.relative(EXPO_DIR, file.path))
    .filter(isChangesetPath);

  return await Promise.all(
    paths.map(async (filePath) => {
      const { stdout } = await Git.runAsync(['show', `${pullRequest.head!.sha}:${filePath}`]);
      try {
        return { changeset: parseChangesetFile(stdout), path: filePath };
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error), path: filePath };
      }
    })
  );
}
