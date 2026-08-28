// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0017-deferred-commands.reference.md §doctor:fix — Dry run is the default
// The two flag values `doctor:fix` reads, as pure functions. A value this command does not
// understand is a `BAD_ARGS` naming the ones it does — never a silent fallback to the default,
// which is how `--tier moderate` typed as `--tier moderatte` becomes a safe run that reported
// success (llp/0006 §Errors are prompts).

import { CommandError } from '../../utils/errors';
import type { NativePlatform } from './fixSteps';
import { FIX_TIERS, type FixTier } from './fixTypes';

/**
 * Read `--tier`.
 *
 * @throws {CommandError} `BAD_ARGS` for anything that is not one of {@link FIX_TIERS}.
 */
export function resolveTier(value: unknown): FixTier {
  if (value == null) {
    return 'safe';
  }
  if (typeof value === 'string' && (FIX_TIERS as string[]).includes(value)) {
    return value as FixTier;
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--tier must be one of ${FIX_TIERS.join(', ')}, but got ${String(value)}.`,
      `Why: the tier is how much this command is allowed to destroy, so it is never guessed.`,
      `How: safe resets caches only; moderate reinstalls the packages and the pods; aggressive regenerates the native projects.`,
    ].join('\n')
  );
}

/**
 * Read `--platform`.
 *
 * @returns the platforms named, or null when the caller named none — which means "read them off
 * the project", and is not the same answer as "both".
 * @throws {CommandError} `BAD_ARGS`
 */
export function resolvePlatforms(value: unknown): NativePlatform[] | null {
  if (value == null) {
    return null;
  }
  if (value === 'all') {
    return ['ios', 'android'];
  }
  if (value === 'ios' || value === 'android') {
    return [value];
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--platform must be ios, android or all, but got ${String(value)}.`,
      `Why: the flag decides which native directories this command resets, and there are two.`,
      `How: leave it out to reset the platforms this project has native directories for.`,
    ].join('\n')
  );
}
