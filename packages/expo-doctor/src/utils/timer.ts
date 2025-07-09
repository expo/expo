const LABEL = 'DEFAULT';
const startTimes: Record<string, number> = {};

export function hasTimer(label: string): number | null {
  return startTimes[label] ?? null;
}

export function startTimer(label = LABEL): void {
  startTimes[label] = Date.now();
}

export function endTimer(label = LABEL, clear: boolean = true): number {
  const endTime = Date.now();
  const startTime = startTimes[label];
  if (startTime) {
    const delta = endTime - startTime;
    if (clear) {
      delete startTimes[label];
    }
    return delta;
  }
  throw new Error(`Timer '${label}' has not be started yet`);
}

/**
 * Optimally format milliseconds
 *
 * @example `1h 2m 3s`
 * @example `5m 18s`
 * @example `40s`
 * @param duration
 */
export function formatMilliseconds(duration: number): string {
  const portions: string[] = [];

  const msInHour = 1000 * 60 * 60;
  const hours = Math.trunc(duration / msInHour);
  if (hours > 0) {
    portions.push(hours + 'h');
    duration = duration - hours * msInHour;
  }

  const msInMinute = 1000 * 60;
  const minutes = Math.trunc(duration / msInMinute);
  if (minutes > 0) {
    portions.push(minutes + 'm');
    duration = duration - minutes * msInMinute;
  }

  const seconds = Math.trunc(duration / 1000);
  if (seconds > 0) {
    portions.push(seconds + 's');
  }

  // so short it rounds down to zero
  if (!portions.length) {
    return '0s';
  }

  return portions.join(' ');
}
