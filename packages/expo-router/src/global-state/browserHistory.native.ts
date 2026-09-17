import type { NavigationState } from '../react-navigation/routers';
import type {
  BrowserHistory,
  BrowserHistoryProjection,
  BrowserHistoryRestore,
} from './browserHistoryTypes';

// Native has no browser history. `createBrowserHistory` returns none, so the reducer never calls
// the other functions; they exist so the path computation stays out of the native bundle.
export function createBrowserHistory(): BrowserHistoryProjection {
  return { history: undefined, events: [] };
}

export function applyRouterHistoryAction(history: BrowserHistory): BrowserHistoryProjection {
  return { history, events: [] };
}

export function updateCurrentHistoryEntry(history: BrowserHistory): BrowserHistoryProjection {
  return { history, events: [] };
}

export function restoreNavigationFromBrowser<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  result: Result
): BrowserHistoryRestore<Result> {
  return { result, history, events: [] };
}
