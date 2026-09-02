// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
// @ref llp/0017-deferred-commands.reference.md §The checkpoint system
// The shared contract of `@expo/agent-cli checkpoint` and `@expo/agent-cli checkpoint:undo`: what one snapshot is, and what
// creating or restoring one reports.

/** One snapshot of the project, stored in `.expo/agent-cli-checkpoints.json`. */
export interface CheckpointRecord {
  /** Object id of the snapshot commit, which is reachable from no branch and no ref. */
  id: string;
  /** Why the snapshot exists, e.g. `@expo/agent-cli install` or a `--label` the user passed. */
  label: string;
  /** ISO 8601 timestamp of the moment the snapshot was written. */
  createdAt: string;
  /** The command that made it, e.g. `["@expo/agent-cli", "install", "expo-sqlite"]`. */
  argv: string[];
  /**
   * Repository-root-relative directory the snapshot covers, `""` for the repository root.
   * A project inside a monorepo is snapshotted on its own, never the whole repository.
   */
  path: string;
}

/** Why a checkpoint was not made. Every reason is a skip, never a failure of the command. */
export type CheckpointSkipReason =
  /** The project is not inside a git work tree, so there is nothing to snapshot into. */
  | 'not-a-git-repo'
  /** `--no-checkpoint` or `AGENT_CLI_NO_CHECKPOINT` turned checkpoints off. */
  | 'suppressed'
  /** Git tracks no file under the project, e.g. everything is ignored. */
  | 'no-files'
  /** A git command failed. The message says which one. */
  | 'git-failed';

/** The outcome of one snapshot attempt. `record` is set when, and only when, one was made. */
export interface CheckpointResult {
  record: CheckpointRecord | null;
  /** Files the snapshot covers, 0 when none was made. */
  files: number;
  /** Null when the snapshot was made. */
  skipped: CheckpointSkipReason | null;
  /** One sentence naming what happened, printable as-is. */
  detail: string;
}

/** What one `@expo/agent-cli checkpoint:undo` run put back. */
export interface UndoResult {
  record: CheckpointRecord;
  /** Files whose contents the restore wrote, including the ones it recreated. */
  filesRestored: number;
  /** Files that exist now and did not exist in the checkpoint: left in place, never deleted. */
  filesKept: number;
  /** Project-relative paths of the restored files, in git's order. */
  paths: string[];
}
