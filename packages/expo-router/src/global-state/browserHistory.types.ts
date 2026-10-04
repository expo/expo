import type { RouteNode } from '../Route';
import type { NavigationState } from '../react-navigation/routers';
import type { PathLinking } from './getPathForState';
import type { RoutingIntent } from './routingQueue';

export type BrowserHistoryEntry = {
  // Stored in `history.state` to recognize the entry on `popstate`.
  id: string;
  path: string;
  // Restored verbatim when the browser returns to this entry.
  state: NavigationState;
};

/** Browser entries tracked by this page, in browser order. */
export type BrowserHistory = {
  entries: readonly BrowserHistoryEntry[];
  index: number;
  // Random per page load, so an id stored before a reload never matches a new entry.
  idPrefix: string;
  entrySeq: number;
};

/** A browser command produced by the reducer and run after commit. */
export type BrowserHistoryEvent =
  | { type: 'browser-history'; op: 'push' | 'replace'; entryId: string; path: string }
  | { type: 'browser-history'; op: 'go'; delta: number };

/** Intents the restore step can reduce; a browser change never nests another browser change. */
export type ReducibleIntent = Exclude<RoutingIntent, { type: 'BROWSER_HISTORY_CHANGED' }>;

/** A browser-originated change; `id` is `null` when the browser created the entry on its own. */
export type BrowserHistoryChange = { id: string | null; path: string };

export type BrowserHistoryAdapter = {
  /** Runs a browser command produced by the navigation reducer. Commands run in order. */
  apply: (event: BrowserHistoryEvent) => void;
  /** Reports browser-originated changes (back, forward, hash links), never the adapter's own `go`. */
  listen: (listener: (change: BrowserHistoryChange) => void) => () => void;
};

export type BrowserHistoryConfig = {
  linking?: PathLinking;
  routeNode?: RouteNode;
  browserHistoryIdPrefix: string;
};

export type BrowserHistoryProjection = {
  /** Updated tracked entries, or `undefined` on platforms without browser history. */
  history: BrowserHistory | undefined;
  /** Ordered browser commands to apply after React commits the matching navigation state. */
  events: BrowserHistoryEvent[];
};

export type BrowserHistoryRestore<Result> = BrowserHistoryProjection & { result: Result };
