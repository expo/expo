import type { NavigationState, RouterBrowserHistoryAction } from './types';

type StateWithHistory = Omit<NavigationState, 'history'> & {
  history?: readonly { type: string; key?: string }[];
};

// A placeholder entry for an unvisited tab has no route, so it has no browser entry.
const countBrowserEntries = (state: StateWithHistory) =>
  state.history?.filter(
    (item) => item.type !== 'route' || state.routes.some((route) => route.key === item.key)
  ).length ?? 0;

/** Maps entries added or removed by a tab or drawer router to browser navigation. */
export function getBrowserHistoryForHistoryChange(
  previous: StateWithHistory,
  next: StateWithHistory
): RouterBrowserHistoryAction | undefined {
  const delta = countBrowserEntries(next) - countBrowserEntries(previous);
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
