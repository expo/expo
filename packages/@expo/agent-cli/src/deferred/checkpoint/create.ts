// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// Making a checkpoint: one git snapshot of the project, taken without touching anything the user
// can see in git. See `git.ts` for the plumbing and its limits.

import chalk from 'chalk';

import * as Log from '../../log';
import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import { CommandError } from '../../utils/errors';
import { debugEvent, event } from './events';
import { commitSnapshotTreeAsync, resolveWorkTreeAsync, writeSnapshotTreeAsync } from './git';
import { recordCheckpoint, resolveCommandArgv } from './store';
import type { CheckpointResult, CheckpointSkipReason } from './types';

/** Label of a checkpoint the user asked for without naming one. */
export const DEFAULT_LABEL = 'manual';

/** Width of the label column of the text output, matching `@expo/agent-cli agents:setup` and `@expo/agent-cli status`. */
const LABEL_WIDTH = 12;

export interface CreateCheckpointOptions {
  /** Why the snapshot exists. Defaults to {@link DEFAULT_LABEL}. */
  label?: string;
  /** The command being guarded. Defaults to the command line this process was started with. */
  argv?: string[];
}

/**
 * Snapshot the project, and remember the snapshot in `.expo/agent-cli-checkpoints.json`.
 *
 * Never throws. Every way a snapshot can fail to happen — no git repository, no tracked file, a
 * git command that failed — comes back as a skip with a reason, because the caller is usually a
 * mutating command that must run either way (llp/0008: a guardrail cannot become the failure).
 */
export async function createCheckpointAsync(
  projectRoot: string,
  options: CreateCheckpointOptions = {}
): Promise<CheckpointResult> {
  const label = options.label?.trim() || DEFAULT_LABEL;

  const worktree = await resolveWorkTreeAsync(projectRoot);
  if (!worktree) {
    return skip(
      label,
      'not-a-git-repo',
      'This project is not inside a git repository, so there is nothing to snapshot into.'
    );
  }

  try {
    const { tree, files } = await writeSnapshotTreeAsync(worktree, projectRoot);
    if (files === 0) {
      return skip(
        label,
        'no-files',
        'Git tracks no file in this project, so the snapshot would be empty.'
      );
    }

    const id = await commitSnapshotTreeAsync(
      worktree,
      tree,
      `${PROGRAM_NAME} checkpoint: ${label}`
    );
    const record = {
      id,
      label,
      createdAt: new Date().toISOString(),
      argv: options.argv ?? resolveCommandArgv(process.argv),
      path: worktree.prefix,
    };
    recordCheckpoint(projectRoot, record);
    event('created', { id, label, files, path: record.path });

    return { record, files, skipped: null, detail: describeCheckpoint(record.path, files) };
  } catch (error: any) {
    debugEvent('git_failed', { argv: error?.argv ?? [], error: debugEvent.error(error as Error) });
    return skip(label, 'git-failed', `Git could not snapshot the project: ${error.message}`);
  }
}

function skip(label: string, reason: CheckpointSkipReason, detail: string): CheckpointResult {
  event('skipped', { label, reason });
  return { record: null, files: 0, skipped: reason, detail };
}

export interface PrintCheckpointOptions {
  label?: string;
  /** Print one JSON object instead of the text summary. */
  json?: boolean;
}

/**
 * The `@expo/agent-cli checkpoint` command: snapshot the project now, and say what the snapshot covers.
 *
 * A snapshot the user asked for explicitly cannot be skipped quietly — an agent that reads
 * "checkpoint made" and then acts would be acting on a promise that was not kept — so every skip
 * becomes an error carrying the next action.
 *
 * @throws {CommandError}
 */
export async function printCheckpointAsync(
  projectRoot: string,
  options: PrintCheckpointOptions
): Promise<void> {
  const result = await createCheckpointAsync(projectRoot, { label: options.label });
  const { record } = result;

  if (!record) {
    throw toCommandError(result);
  }

  if (options.json) {
    Log.log(
      JSON.stringify(
        {
          created: true,
          id: record.id,
          label: record.label,
          createdAt: record.createdAt,
          files: result.files,
          path: record.path,
          skipped: null,
        },
        null,
        2
      )
    );
    return;
  }

  const row = (label: string, value: string) =>
    Log.log(`${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`);

  row('Checkpoint', chalk.bold(shortId(record.id)));
  row('Label', record.label);
  row('Covers', result.detail);
  row('Undo', chalk.bold(`${PROGRAM_PREFIX} checkpoint:undo --id ${shortId(record.id)}`));
}

/** Turn a skip into the error and the next action that fit it. */
function toCommandError(result: CheckpointResult): CommandError {
  if (result.skipped === 'not-a-git-repo') {
    const error = new CommandError(
      'NOT_A_GIT_REPO',
      `${result.detail} Checkpoints are git snapshots, so this project needs a git repository first.`
    );
    error.suggestedCommand = 'git init && git add -A && git commit -m "initial commit"';
    return error;
  }
  if (result.skipped === 'no-files') {
    return new CommandError(
      'CHECKPOINT_EMPTY',
      `${result.detail} Check the ignore rules that apply here with "git check-ignore -v .", or commit the project's files once.`
    );
  }
  return new CommandError('CHECKPOINT_FAILED', result.detail);
}

/** What the snapshot covers, in one phrase, e.g. `apps/app (12 files, git-tracked only)`. */
function describeCheckpoint(prefix: string, files: number): string {
  const scope = prefix || 'the whole repository';
  return `${scope} (${files} ${files === 1 ? 'file' : 'files'}, git-tracked only)`;
}

/** The abbreviated object id, which is what the terminal and the follow-up hints show. */
export function shortId(id: string): string {
  return id.slice(0, 7);
}
