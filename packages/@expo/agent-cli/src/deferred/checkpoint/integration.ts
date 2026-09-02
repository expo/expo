// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// The one call a mutating command makes before it changes anything.
//
// A guardrail that can fail the command it guards is worse than no guardrail, so this never
// throws and never changes an exit code: a checkpoint that could not be made is a line of output,
// and the command runs anyway.

import chalk from 'chalk';

import * as Log from '../../log';
import { PROGRAM_PREFIX } from '../../programName';
import { env } from '../../utils/env';
import { createCheckpointAsync, shortId } from './create';
import { event } from './events';
import type { CheckpointResult } from './types';

/** Width of the label column of the text output, matching the other commands. */
const LABEL_WIDTH = 12;

/**
 * Whether an automatic checkpoint should be made at all.
 *
 * `@expo/agent-cli checkpoint` does not ask: a snapshot the user typed the command for is never
 * suppressed by a setting that is there to keep the automatic ones out of the way.
 *
 * @param flag `false` when `--no-checkpoint` was passed, `undefined` when the command has no flag.
 */
export function checkpointsEnabled(flag: boolean | undefined): boolean {
  return flag !== false && !env.AGENT_CLI_NO_CHECKPOINT;
}

export interface CheckpointBeforeOptions {
  /** The command the snapshot is taken for, e.g. `@expo/agent-cli install`. */
  label: string;
  /** `false` when `--no-checkpoint` was passed. */
  enabled?: boolean;
  /**
   * The caller owns stdout, e.g. it prints one JSON object (`--json`), so the line naming the
   * snapshot is left out. The `checkpoint:created` event still reports it.
   */
  silent?: boolean;
}

/**
 * Snapshot the project before a command changes it.
 *
 * Silent unless there is something to say: the id of the snapshot that was made, or a warning
 * when git refused to make one. A project outside git says nothing at all — that is the normal
 * state of a fresh app, and the JSONL event already reports it.
 */
export async function checkpointBeforeAsync(
  projectRoot: string,
  options: CheckpointBeforeOptions
): Promise<CheckpointResult> {
  if (!checkpointsEnabled(options.enabled)) {
    event('skipped', { label: options.label, reason: 'suppressed' });
    return {
      record: null,
      files: 0,
      skipped: 'suppressed',
      detail: 'Checkpoints are turned off for this run.',
    };
  }

  const result = await createCheckpointAsync(projectRoot, { label: options.label });

  if (result.record && !options.silent) {
    Log.log(
      `${chalk.dim('Checkpoint'.padEnd(LABEL_WIDTH))}${chalk.bold(shortId(result.record.id))}  ${chalk.dim(
        `${result.files} ${result.files === 1 ? 'file' : 'files'} — restore with "${PROGRAM_PREFIX} checkpoint:undo"`
      )}`
    );
  } else if (result.skipped === 'git-failed') {
    // Worth saying out loud: the user asked for a command that changes the project, and the
    // safety net they would expect is not there for this run.
    Log.warn(`${result.detail} Continuing without a checkpoint.`);
  }

  return result;
}
