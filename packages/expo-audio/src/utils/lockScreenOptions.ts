import type { AudioLockScreenOptions } from '../AudioConstants';

/**
 * The interval used when a skip interval is not provided or is not a usable number.
 */
const DEFAULT_SEEK_INTERVAL_SECONDS = 10;

/**
 * The smallest interval the platforms accept. Values below this are clamped up so that a
 * misconfigured interval never turns the skip buttons into no-ops.
 */
const MIN_SEEK_INTERVAL_SECONDS = 0.1;

function normalizeInterval(seconds: number | undefined): number {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return DEFAULT_SEEK_INTERVAL_SECONDS;
  }
  return Math.max(seconds, MIN_SEEK_INTERVAL_SECONDS);
}

/**
 * Returns a copy of the lock screen options with both skip intervals resolved to a usable number
 * of seconds, so that every platform receives the same already-validated values.
 */
export function normalizeLockScreenOptions(
  options: AudioLockScreenOptions | undefined
): AudioLockScreenOptions {
  return {
    ...options,
    seekForwardIntervalSeconds: normalizeInterval(options?.seekForwardIntervalSeconds),
    seekBackwardIntervalSeconds: normalizeInterval(options?.seekBackwardIntervalSeconds),
  };
}
