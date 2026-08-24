// @ref llp/0011-impact-and-freshness.rfc.md §When the fingerprint did not move
// The file-level view, for the case the fingerprint cannot answer: the native surface is
// unchanged, so what is left is whether the running dev server can pick the change up by itself.
//
// git is the only thing that knows what "changed" means here, and a project outside git is a
// normal case (a fresh `create-expo-app` is not a repository), so this answers `null` rather than
// failing — the report then says the class came from the fingerprint alone.

import { runGitAsync } from '../checkpoint/git';
import { resolveWorkTreeAsync } from '../checkpoint/git';

/**
 * The paths git reports as changed in the working tree, relative to the project root.
 *
 * `git status --porcelain` rather than `git diff --name-only`, because a file that is new and not
 * yet staged is exactly the change a caller is asking about, and `diff` does not list it.
 * Untracked files count; ignored ones do not, which is what keeps `node_modules` out.
 *
 * @returns the changed paths, or `null` when the project is not in a git work tree or git failed.
 */
export async function listChangedFilesAsync(projectRoot: string): Promise<string[] | null> {
  const worktree = await resolveWorkTreeAsync(projectRoot);
  if (!worktree) {
    return null;
  }

  let output: string;
  try {
    // `-z` so a path with a space, a quote or a newline in it survives; git otherwise quotes and
    // escapes such a path, and a reader that split on newlines would report two files.
    output = await runGitAsync(['status', '--porcelain', '-z', '--untracked-files=all', '.'], {
      cwd: projectRoot,
    });
  } catch {
    return null;
  }

  return parseStatusZ(output);
}

/**
 * Read the NUL-separated porcelain output.
 *
 * Each record is `XY <path>`, and a rename adds a second record holding the *old* path with no
 * status prefix — which is why the parser tracks whether the previous record was a rename rather
 * than treating every record the same. Paths are relative to the directory git ran in, which is
 * the project root.
 */
export function parseStatusZ(output: string): string[] {
  const records = output.split('\0').filter((record) => record.length > 0);
  const files: string[] = [];

  for (let index = 0; index < records.length; index++) {
    const record = records[index]!;
    const status = record.slice(0, 2);
    const file = record.slice(3);
    if (!file) {
      continue;
    }
    files.push(file);
    // A rename or a copy is followed by one bare record holding the source path. It is skipped:
    // the file that matters is where the content is now, and counting both would double a move.
    if (status.includes('R') || status.includes('C')) {
      index += 1;
    }
  }

  return files;
}
