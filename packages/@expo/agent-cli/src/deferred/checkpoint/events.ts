// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0008
//
import { events } from '2g';
import type { SerializedError } from '2g';

declare module '2g' {
  interface EventRegistry {
    /**
     * A snapshot was written. The id is a git object id that no branch points at, so an agent
     * can hand it back to `@expo/agent-cli checkpoint:undo --id <id>` but never has to touch git itself.
     *
     * @see llp/0017-deferred-commands.reference.md §The checkpoint system
     */
    'checkpoint:created': {
      id: string;
      label: string;
      /** Files the snapshot covers. */
      files: number;
      /** Repository-root-relative directory the snapshot covers, `""` for the root. */
      path: string;
    };
    /** No snapshot was written. Never an error: the command it guards runs anyway. */
    'checkpoint:skipped': { label: string; reason: string };
    /** A snapshot was restored into the working tree. */
    'checkpoint:restored': {
      id: string;
      label: string;
      filesRestored: number;
      /** Files created after the checkpoint, which the restore left in place. */
      filesKept: number;
    };
    'checkpoint:git_failed': { argv: string[]; error: SerializedError };
    'checkpoint:store_write_failed': { error: SerializedError };
  }
}

export const event = events('checkpoint');
export const debugEvent = events.debug('checkpoint');
