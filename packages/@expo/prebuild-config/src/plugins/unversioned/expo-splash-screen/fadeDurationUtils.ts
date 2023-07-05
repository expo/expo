export const defaultFadeDurationMs = 0;
export const minFadeDurationMs = 0;
export const maxFadeDurationMs = 5000;

export const computeFadeDurationMs: (maybeDuration: any) => number = (maybeDuration) => {
  if (typeof maybeDuration !== 'number') {
    return defaultFadeDurationMs;
  }
  const duration = maybeDuration as number;
  if (duration >= maxFadeDurationMs) {
    return maxFadeDurationMs;
  }
  if (duration <= minFadeDurationMs) {
    return minFadeDurationMs;
  }
  return duration;
};
