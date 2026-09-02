// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// Undoing: put the files of a checkpoint back, and say what that changed.
//
// The mechanism, and its limits, in one place — `git.ts` holds the calls:
//
// 1. `git read-tree <checkpoint>` fills a temporary index with the snapshot;
// 2. `git checkout-index -a -f`, run from the work tree root with that index, writes every file
//    of the snapshot into the working tree.
//
// What follows from that:
//
// - **Restored:** every file the checkpoint holds, whether it was changed or deleted since.
// - **Kept:** files created after the checkpoint. `checkout-index` only writes, so an undo never
//   deletes anything. Removing a file the checkpoint did not have stays the user's decision.
// - **Untouched:** `HEAD`, branches, tags, the reflog, the stash, and the user's index. Commits
//   made after the checkpoint are still there; only the contents of files change, which
//   `git status` then reports as ordinary working-tree changes.
// - **Not covered:** anything git ignores — `node_modules`, `ios/Pods`, `.env`, `.expo`. A
//   restored `package.json` therefore needs an install, which is what the follow-up says.

import chalk from 'chalk';

import { followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import { CommandError } from '../../utils/errors';
import { shortId } from './create';
import { debugEvent, event } from './events';
import { buildUndoFollowUps } from './followups';
import {
  diffTreesAsync,
  objectExistsAsync,
  resolveWorkTreeAsync,
  restoreTreeAsync,
  writeSnapshotTreeAsync,
} from './git';
import { findCheckpoint, formatAge, readCheckpoints } from './store';
import type { CheckpointRecord, UndoResult } from './types';

/** Width of the label column of the text output, matching the other commands. */
const LABEL_WIDTH = 12;

/** How many restored paths the text output names before it counts the rest. */
const MAX_LISTED_PATHS = 10;

export interface UndoOptions {
  /** Checkpoint to restore, exact or abbreviated. Defaults to the most recent one. */
  id?: string;
}

/**
 * Restore one checkpoint into the working tree.
 *
 * @throws {CommandError} when there is nothing to restore, or when git could not restore it.
 * Every error carries the command that resolves it: an undo that cannot happen is a prompt.
 */
export async function undoAsync(projectRoot: string, options: UndoOptions): Promise<UndoResult> {
  const records = readCheckpoints(projectRoot);
  if (!records.length) {
    const error = new CommandError(
      'NO_CHECKPOINTS',
      `No checkpoint is recorded for this project. "${PROGRAM_NAME} install", "${PROGRAM_NAME} agents:setup" and "${PROGRAM_NAME} dev" record one before they change anything, and "${PROGRAM_NAME} checkpoint" records one now.`
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} checkpoint`;
    throw error;
  }

  const record = findCheckpoint(records, options.id);
  if (!record) {
    const error = new CommandError(
      'CHECKPOINT_NOT_FOUND',
      `No checkpoint of this project has the id "${options.id}". The ids of the ${records.length} recorded checkpoints are listed by "${PROGRAM_NAME} checkpoint:list".`
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} checkpoint:list`;
    throw error;
  }

  const worktree = await resolveWorkTreeAsync(projectRoot);
  if (!worktree) {
    throw new CommandError(
      'NOT_A_GIT_REPO',
      `This project is not inside a git repository, so the snapshot ${shortId(record.id)} cannot be read back: a checkpoint is a git object in the repository the project was in when it was made.`
    );
  }

  if (!(await objectExistsAsync(worktree, record.id))) {
    const error = new CommandError(
      'CHECKPOINT_OBJECT_MISSING',
      `Git no longer has the snapshot ${shortId(record.id)}. A checkpoint is an unreferenced git object, so "git gc --prune=now" deletes it. Restore an older checkpoint, or recover the files from git history.`
    );
    error.suggestedCommand = `${PROGRAM_PREFIX} checkpoint:list`;
    throw error;
  }

  try {
    // The comparison runs before anything is written, so the report describes this restore and
    // not the state it produced.
    const { tree } = await writeSnapshotTreeAsync(worktree, projectRoot);
    const diff = await diffTreesAsync(worktree, tree, record.id);
    await restoreTreeAsync(worktree, record.id);

    const paths = diff
      .filter((entry) => entry.kind === 'restore')
      .map((entry) => toProjectPath(entry.path, record.path));
    const filesKept = diff.filter((entry) => entry.kind === 'keep').length;

    event('restored', {
      id: record.id,
      label: record.label,
      filesRestored: paths.length,
      filesKept,
    });

    return { record, filesRestored: paths.length, filesKept, paths };
  } catch (error: any) {
    debugEvent('git_failed', { argv: error?.argv ?? [], error: debugEvent.error(error as Error) });
    throw new CommandError(
      'UNDO_FAILED',
      `Git could not restore the checkpoint ${shortId(record.id)}: ${error.message}. The working tree may be partly restored; run "git status" to see where it stands.`
    );
  }
}

/** Turn a work-tree-relative path into one relative to the project. */
function toProjectPath(filePath: string, prefix: string): string {
  return prefix && filePath.startsWith(`${prefix}/`) ? filePath.slice(prefix.length + 1) : filePath;
}

export interface PrintUndoOptions extends UndoOptions {
  /** Print one JSON object instead of the text summary. */
  json?: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups?: boolean;
}

/** The `@expo/agent-cli checkpoint:undo` command: restore a checkpoint, then say what changed and what is left. */
export async function printUndoAsync(
  projectRoot: string,
  options: PrintUndoOptions
): Promise<void> {
  const result = await undoAsync(projectRoot, options);
  const { record } = result;

  // What a restore cannot put back is what the follow-ups are about, so they are computed from
  // the restored paths themselves.
  const followups = followUpsEnabled(options.followups)
    ? buildUndoFollowUps({ paths: result.paths })
    : [];

  if (options.json) {
    Log.log(
      JSON.stringify(
        {
          restored: true,
          id: record.id,
          label: record.label,
          createdAt: record.createdAt,
          filesRestored: result.filesRestored,
          filesKept: result.filesKept,
          paths: result.paths,
          followups,
        },
        null,
        2
      )
    );
    reportFollowUps('checkpoint:undo', followups, { json: true });
    return;
  }

  const row = (label: string, value: string) =>
    Log.log(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row(
    'Undo',
    `${chalk.bold(shortId(record.id))}  ${record.label}  ${chalk.dim(`(${formatAge(record.createdAt)} ago)`)}`
  );
  row('Restored', `${result.filesRestored} ${result.filesRestored === 1 ? 'file' : 'files'}`);
  row(
    'Kept',
    result.filesKept
      ? `${result.filesKept} ${result.filesKept === 1 ? 'file' : 'files'} created since the checkpoint, left in place`
      : chalk.dim('nothing was created since the checkpoint')
  );
  if (result.paths.length) {
    row('Files', formatPaths(result.paths));
  }

  reportFollowUps('checkpoint:undo', followups);
}

/** The restored paths, capped so a large restore stays one readable line. */
function formatPaths(paths: string[]): string {
  const listed = paths.slice(0, MAX_LISTED_PATHS).join(', ');
  const rest = paths.length - MAX_LISTED_PATHS;
  return rest > 0 ? `${listed} and ${rest} more` : listed;
}

export interface PrintCheckpointListOptions {
  json?: boolean;
}

/**
 * The `@expo/agent-cli checkpoint:list` command: the checkpoints this project has.
 *
 * Reads the store only. It answers in a project whose repository is gone, and never spawns git.
 */
export async function printCheckpointListAsync(
  projectRoot: string,
  options: PrintCheckpointListOptions
): Promise<void> {
  const records = readCheckpoints(projectRoot);

  if (options.json) {
    Log.log(JSON.stringify({ checkpoints: records.map(describeRecord) }, null, 2));
    return;
  }

  if (!records.length) {
    Log.log(
      chalk.dim(
        `No checkpoint is recorded for this project. Record one with "${PROGRAM_PREFIX} checkpoint".`
      )
    );
    return;
  }

  Log.log(`${chalk.dim('Checkpoints'.padEnd(LABEL_WIDTH))}${records.length}`);
  for (const record of records) {
    // One fact per line, in a fixed column order: id, age, label, and the command that made it.
    Log.log(
      [
        chalk.bold(shortId(record.id).padEnd(8)),
        formatAge(record.createdAt).padEnd(5),
        record.label,
        record.argv.length ? chalk.dim(`(${record.argv.join(' ')})`) : '',
      ]
        .join(' ')
        .trimEnd()
    );
  }
}

/** One stored checkpoint, as `--json` reports it. */
function describeRecord(record: CheckpointRecord) {
  return {
    id: record.id,
    label: record.label,
    createdAt: record.createdAt,
    age: formatAge(record.createdAt),
    argv: record.argv,
    path: record.path,
  };
}
