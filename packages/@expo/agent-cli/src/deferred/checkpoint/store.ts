// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// The list of snapshots a project has, in `.expo/agent-cli-checkpoints.json`.
//
// The store holds git object ids, not contents: it is an index over objects that live in the
// project's own `.git` directory. It is advisory the same way `agent-cli-last-build.json` is — a
// missing, corrupt, or unwritable store costs the user an undo, never a command.

import fs from 'fs';
import path from 'path';

import { PROGRAM_NAME } from '../../programName';
import { debugEvent } from './events';
import type { CheckpointRecord } from './types';

/** Name of the store inside the project's `.expo` directory. */
export const CHECKPOINTS_FILE_NAME = 'agent-cli-checkpoints.json';

/**
 * How many snapshots one project keeps.
 *
 * Enough to undo a session's worth of agent actions, small enough that the objects they hold
 * stay a rounding error next to `node_modules`.
 */
export const MAX_CHECKPOINTS = 20;

function getStoreFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', CHECKPOINTS_FILE_NAME);
}

/**
 * Read the project's snapshots, newest first.
 *
 * Never throws: an unreadable or unexpected store reads as "no checkpoints", which makes `undo`
 * say there is nothing to undo instead of failing on the project's own state.
 */
export function readCheckpoints(projectRoot: string): CheckpointRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(getStoreFilePath(projectRoot), 'utf8'));
  } catch {
    return [];
  }

  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }

  const entries = (parsed as Record<string, unknown>).checkpoints;
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter(isRecordLike).map(normalizeRecord);
}

/** Whether a stored entry has the one field that makes it usable: the object id. */
function isRecordLike(entry: unknown): entry is Record<string, unknown> {
  return (
    entry != null &&
    typeof entry === 'object' &&
    typeof (entry as Record<string, unknown>).id === 'string' &&
    !!(entry as Record<string, unknown>).id
  );
}

/** Fill in the fields an older or hand-edited store may not have. */
function normalizeRecord(entry: Record<string, unknown>): CheckpointRecord {
  return {
    id: entry.id as string,
    label: typeof entry.label === 'string' ? entry.label : '',
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : '',
    argv: Array.isArray(entry.argv) ? entry.argv.filter((arg) => typeof arg === 'string') : [],
    path: typeof entry.path === 'string' ? entry.path : '',
  };
}

/**
 * Prepend one snapshot to the store and prune the oldest beyond {@link MAX_CHECKPOINTS}.
 *
 * Best-effort by design: this runs while a mutating command is starting, and a project whose
 * `.expo` directory cannot be written must not see that command fail.
 */
export function recordCheckpoint(projectRoot: string, record: CheckpointRecord): void {
  try {
    const checkpoints = [record, ...readCheckpoints(projectRoot)].slice(0, MAX_CHECKPOINTS);
    // Imported lazily: reading the store must not create the directory it lives in.
    const { ensureDotExpoProjectDirectoryInitialized } =
      require('../../utils/dotExpo') as typeof import('../../utils/dotExpo');
    ensureDotExpoProjectDirectoryInitialized(projectRoot);
    fs.writeFileSync(
      getStoreFilePath(projectRoot),
      JSON.stringify({ checkpoints }, null, 2) + '\n'
    );
  } catch (error) {
    debugEvent('store_write_failed', { error: debugEvent.error(error as Error) });
  }
}

/**
 * The checkpoint an `undo` should restore: the one whose id was asked for, or the newest.
 *
 * An `id` matches exactly or as a prefix, so an agent can pass the short id the terminal printed.
 * The newest match wins, which is the same answer git gives for an unambiguous abbreviation.
 */
export function findCheckpoint(records: CheckpointRecord[], id?: string): CheckpointRecord | null {
  if (!id) {
    return records[0] ?? null;
  }
  return records.find((record) => record.id === id || record.id.startsWith(id)) ?? null;
}

/**
 * The command line to record with a snapshot, from `process.argv`.
 *
 * The node binary and the script path say nothing about what ran, so the record starts at the
 * command name the user typed.
 */
export function resolveCommandArgv(processArgv: string[]): string[] {
  return [`${PROGRAM_NAME}`, ...processArgv.slice(2)];
}

/** How long ago a checkpoint was made, in the largest whole unit, e.g. `3h`. */
export function formatAge(createdAt: string, now: Date = new Date()): string {
  const createdMs = Date.parse(createdAt);
  if (Number.isNaN(createdMs)) {
    return '?';
  }

  const seconds = Math.max(0, Math.round((now.getTime() - createdMs) / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}
