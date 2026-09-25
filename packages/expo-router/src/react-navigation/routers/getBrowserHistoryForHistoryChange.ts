import type { NavigationState, RouterBrowserHistoryAction } from './types';

type StateWithHistory = NavigationState & { history?: readonly unknown[] };

/** Maps entries added or removed by a tab or drawer router to browser navigation. */
export function getBrowserHistoryForHistoryChange(
  previous: StateWithHistory,
  next: StateWithHistory
): RouterBrowserHistoryAction | undefined {
  const delta = (next.history?.length ?? 0) - (previous.history?.length ?? 0);
  if (delta > 0) {
    return { type: 'push' };
  }
  if (delta < 0) {
    return {
      type: 'pop',
      count: -delta,
      target: { navigatorKey: next.key, routeKey: next.routes[next.index]!.key },
    };
  }
  return undefined;
}
