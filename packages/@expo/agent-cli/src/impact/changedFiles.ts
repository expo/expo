// @ref llp/0011-impact-and-freshness.rfc.md §When the fingerprint did not move
// The file-level view, for the case the fingerprint cannot answer: the native surface is
// unchanged, so what is left is whether the running dev server can pick the change up by itself.
//
// git is the only thing that knows what "changed" means here, and a project outside git is a
// normal case (a fresh `create-expo-app` is not a repository), so this answers `null` rather than
// failing — the report then says the class came from the fingerprint alone.

import { resolveWorkTreeAsync, runGitAsync } from '../utils/git';

/**
 * Why the file-level view has no answer.
 *
 * Two causes, and telling them apart is the whole of friction run 6's F60: `impact` printed
 * "This project is not in a git work tree" for a project another command had just read git from in
 * the same directory. Both resolved the work tree the same way ({@link resolveWorkTreeAsync}); what
 * differed was that a `git status` that *failed* was reported with the sentence written for a
 * project that has no repository at all.
 */
export type ChangedFilesGap =
  /** `git rev-parse --is-inside-work-tree` said no, or git could not be started. */
  | 'not-a-work-tree'
  /** The work tree resolved, and the `git status` that follows did not. */
  | 'git-failed';

/** The file-level view, or why there is none. */
export type ChangedFilesResult =
  | { files: string[]; gap: null; detail: null }
  | { files: null; gap: ChangedFilesGap; detail: string };

/**
 * The paths git reports as changed in the working tree, relative to the project root.
 *
 * `git status --porcelain` rather than `git diff --name-only`, because a file that is new and not
 * yet staged is exactly the change a caller is asking about, and `diff` does not list it.
 * Untracked files count; ignored ones do not, which is what keeps `node_modules` out.
 *
 * @returns the changed paths, or the reason there are none to report — never both, and never one
 * reason wearing the other's sentence (F60).
 */
export async function listChangedFilesAsync(projectRoot: string): Promise<ChangedFilesResult> {
  const worktree = await resolveWorkTreeAsync(projectRoot);
  if (!worktree) {
    return {
      files: null,
      gap: 'not-a-work-tree',
      detail: `git reported that ${projectRoot} is not inside a work tree`,
    };
  }

  let output: string;
  try {
    // `-z` so a path with a space, a quote or a newline in it survives; git otherwise quotes and
    // escapes such a path, and a reader that split on newlines would report two files.
    output = await runGitAsync(['status', '--porcelain', '-z', '--untracked-files=all', '.'], {
      cwd: projectRoot,
    });
  } catch (error: unknown) {
    return {
      files: null,
      gap: 'git-failed',
      // The work tree resolved, so this is git failing at the second step — a sentence about a
      // project with no repository would be false here, and it is what used to be printed.
      detail: `the work tree at ${worktree.toplevel} resolved, and "git status" in it failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return { files: parseStatusZ(output), gap: null, detail: null };
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
