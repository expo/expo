import { isEnabled } from './enable';
import type { RouterPerformanceMarkByName, RouterPerformanceMarkName } from './types';

export type * from './types';
export { isEnabled, unstable_enablePerformanceIntegration } from './enable';

export function mark<Name extends RouterPerformanceMarkName>(
  name: Name,
  detail: RouterPerformanceMarkByName<Name>['detail']
) {
  if (!isEnabled()) {
    return;
  }
  try {
    performance.mark?.(name, { detail });
  } catch {
    // `performance.mark` throws for a `detail` that cannot be cloned.
  }
}

export const unstable_performance = globalThis.performance;
export const unstable_PerformanceObserver = globalThis.PerformanceObserver;
