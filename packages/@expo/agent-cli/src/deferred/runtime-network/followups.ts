// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// @ref llp/0009-smart-followups.rfc.md §Examples per command — the runtime loop.
// The `Next:` rungs of `@expo/agent-cli runtime:network`, lifted out of `src/followups/runtime.ts`
// when the command left the v1 surface.

import { capFollowUps, type FollowUp } from '../../followups/types';
import { PROGRAM_PREFIX } from '../../programName';

export interface RuntimeNetworkFollowUpInput {
  /** How many requests the window collected. */
  count: number;
  /** How many of those requests the runtime reported as failed. */
  failedCount: number;
  /** How many of those requests the runtime never answered. */
  pendingCount: number;
  /** The window that was listened on, in milliseconds. */
  durationMs: number;
}

/**
 * The four outcomes of `runtime:network` need different next steps: a failed request is a lead to
 * follow in the app's error log, a request that never answered is usually a connection error that
 * only JavaScript saw, an empty window means the call was never made inside it, and a window where
 * everything answered rules the network out as the cause.
 */
export function buildRuntimeNetworkFollowUps({
  count,
  failedCount,
  pendingCount,
  durationMs,
}: RuntimeNetworkFollowUpInput): FollowUp[] {
  if (failedCount > 0) {
    return capFollowUps([
      {
        id: 'runtime-network-errors',
        command: `${PROGRAM_PREFIX} runtime:errors --duration ${durationMs}`,
        why: 'A failed request usually also throws in the app, and the error window carries the stack of the code that made the call.',
      },
      {
        id: 'runtime-network-rerun',
        command: `${PROGRAM_PREFIX} runtime:network --duration ${durationMs}`,
        why: 'Fix the failing request, repeat the same steps, and confirm every request in this window answers.',
      },
    ]);
  }

  if (pendingCount > 0) {
    return capFollowUps([
      {
        id: 'runtime-network-pending',
        command: `${PROGRAM_PREFIX} runtime:errors --duration ${durationMs}`,
        why: 'A request the runtime never answered is usually a connection error, which React Native reports to JavaScript but not to the network log, so the reason is in the app error log.',
      },
      {
        id: 'runtime-network-rerun',
        command: `${PROGRAM_PREFIX} runtime:network --duration ${durationMs * 2}`,
        why: 'A longer window separates a request that could not connect from one that was only slow to answer.',
      },
    ]);
  }

  if (count === 0) {
    return capFollowUps([
      {
        id: 'runtime-network-reproduce',
        command: `${PROGRAM_PREFIX} runtime:network --duration ${durationMs * 2}`,
        why: 'Requests made before this window are not captured, so trigger the network call while a longer window listens.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'runtime-network-clean',
      command: `${PROGRAM_PREFIX} runtime:errors --duration ${durationMs}`,
      why: 'Every request answered, so a wrong screen comes from how the app parses or renders the data, not from the network.',
    },
  ]);
}
