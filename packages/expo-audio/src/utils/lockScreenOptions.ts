import type { AudioLockScreenOptions } from '../AudioConstants';

const DEFAULT_SEEK_INTERVAL_SECONDS = 10;
const MIN_SEEK_INTERVAL_SECONDS = 0.1;

function normalizeInterval(seconds: number | undefined): number {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return DEFAULT_SEEK_INTERVAL_SECONDS;
  }
  return Math.max(seconds, MIN_SEEK_INTERVAL_SECONDS);
}

export function normalizeLockScreenOptions(
  options: AudioLockScreenOptions | undefined
): AudioLockScreenOptions {
  return {
    ...options,
    seekForwardIntervalSeconds: normalizeInterval(options?.seekForwardIntervalSeconds),
    seekBackwardIntervalSeconds: normalizeInterval(options?.seekBackwardIntervalSeconds),
  };
}
