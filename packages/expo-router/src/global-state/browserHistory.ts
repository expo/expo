import type { NavigationState } from '../react-navigation/routers';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
import { getHistoryLength } from '../utils/stack';
import type {
  BrowserHistory,
  BrowserHistoryConfig,
  BrowserHistoryEvent,
  BrowserHistoryProjection,
  BrowserHistoryRestore,
  ReducibleIntent,
} from './browserHistoryTypes';
import { completeParsedState, createSeededRootState } from './createSeededNavigationState';
import { getPathForState, resolvePathLinking } from './getPathForState';
import { getRouteInfoFromState } from './getRouteInfoFromState';
import { getRootStackRouteNames } from './utils';

type Reduce<Result> = (result: Result, intent: ReducibleIntent) => Result;

/** The first entry claims whatever entry the browser is on when the app loads. */
export function createBrowserHistory(
  state: NavigationState,
  config: BrowserHistoryConfig
): BrowserHistoryProjection {
  const id = `${config.browserHistoryIdPrefix}:0`;
  const path = getPathForState(state, config.linking);
  return {
    history: {
      entries: [{ id, path, state }],
      index: 0,
      idPrefix: config.browserHistoryIdPrefix,
      entrySeq: 1,
    },
    events: [replace(id, path)],
  };
}

/**
 * Applies a navigation state change to the owned browser entries. The focused navigator's
 * history growing is a push, shrinking is a traversal back, anything else refreshes the entry.
 */
export function projectBrowserHistory(
  history: BrowserHistory,
  previousState: NavigationState,
  nextState: NavigationState,
  config: BrowserHistoryConfig
): BrowserHistoryProjection {
  const path = getPathForState(nextState, config.linking);
  const [previousFocused, focused] = findMatchingState(previousState, nextState);
  const delta =
    previousFocused && focused ? getHistoryLength(focused) - getHistoryLength(previousFocused) : 0;

  if (delta > 0) {
    return appendEntry(history, nextState, path, 'push');
  }
  return refreshEntry(history, Math.max(0, history.index + delta), nextState, path);
}

/** Refreshes the current entry after a structural change that is not a navigation. */
export function refreshBrowserHistory(
  history: BrowserHistory,
  nextState: NavigationState,
  config: BrowserHistoryConfig
): BrowserHistoryProjection {
  return refreshEntry(
    history,
    history.index,
    nextState,
    getPathForState(nextState, config.linking)
  );
}

/**
 * Applies a browser-originated change. An owned entry restores its saved state. An entry the
 * browser created on its own (`id` is `null`, e.g. a hash link) is claimed as the next owned
 * entry. An entry from before this page load replaces the owned list, since the rest of the
 * browser stack is unknown. Every change leaves the browser entry claimed by the reducer, so the
 * owned entries and the browser stack cannot drift apart.
 */
export function restoreBrowserHistory<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  result: Result,
  change: { id: string | null; path: string },
  config: BrowserHistoryConfig,
  reduce: Reduce<Result>
): BrowserHistoryRestore<Result> {
  const owned =
    change.id === null ? -1 : history.entries.findIndex((entry) => entry.id === change.id);
  const ownedEntry = history.entries[owned];
  if (ownedEntry) {
    const reduced =
      ownedEntry.path === change.path
        ? reduce(result, reset(ownedEntry.state))
        : reduceToPath(history, ownedEntry.path, result, change.path, config, reduce);
    if (reduced.state === result.state) {
      // The restore was prevented, so move the browser back to the entry that matches the UI.
      return {
        result: reduced,
        history,
        events:
          owned === history.index
            ? []
            : [{ type: 'browser-history', op: 'go', delta: history.index - owned }],
      };
    }
    const path = getPathForState(reduced.state, config.linking);
    return {
      result: reduced,
      history: {
        ...history,
        entries: history.entries.map((entry, index) =>
          index === owned ? { ...entry, path, state: reduced.state } : entry
        ),
        index: owned,
      },
      events: path === change.path ? [] : [replace(ownedEntry.id, path)],
    };
  }

  const reduced = reduceToPath(
    history,
    history.entries[history.index]!.path,
    result,
    change.path,
    config,
    reduce
  );
  const path = getPathForState(reduced.state, config.linking);
  if (change.id === null) {
    return { result: reduced, ...appendEntry(history, reduced.state, path, 'replace') };
  }
  return {
    result: reduced,
    history: { ...history, entries: [{ id: change.id, path, state: reduced.state }], index: 0 },
    events: [replace(change.id, path)],
  };
}

function reduceToPath<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  basePath: string,
  result: Result,
  path: string,
  config: BrowserHistoryConfig,
  reduce: Reduce<Result>
): Result {
  // Only the hash changed, so the route keeps its state and gets the hash as a param.
  if (stripHash(path) === stripHash(basePath)) {
    return reduce(result, {
      type: 'NAVIGATE_TO_HREF',
      payload: { href: path, options: { event: 'NAVIGATE' } },
    });
  }

  const parsed = resolvePathLinking(config.linking).getStateFromPath(
    path,
    config.linking?.config,
    getRouteInfoFromState(result.state).segments
  );
  const routeNames = getRootStackRouteNames();
  const state =
    parsed && parsed.routes.every((route) => routeNames.includes(route.name))
      ? config.routeNode
        ? createSeededRootState(parsed, config.routeNode)
        : completeParsedState(parsed, ROOT_CHAIN)
      : undefined;
  // A path outside the app falls back to the first entry.
  return reduce(result, reset(state ?? history.entries[0]!.state));
}

function appendEntry(
  history: BrowserHistory,
  state: NavigationState,
  path: string,
  op: 'push' | 'replace'
): BrowserHistoryProjection {
  const id = `${history.idPrefix}:${history.entrySeq}`;
  const entries = [...history.entries.slice(0, history.index + 1), { id, path, state }];
  return {
    history: { ...history, entries, index: entries.length - 1, entrySeq: history.entrySeq + 1 },
    events: [{ type: 'browser-history', op, entryId: id, path }],
  };
}

function refreshEntry(
  history: BrowserHistory,
  index: number,
  state: NavigationState,
  path: string
): BrowserHistoryProjection {
  const entry = { ...history.entries[index]!, path, state };
  const events: BrowserHistoryEvent[] = [];
  if (index !== history.index) {
    events.push({ type: 'browser-history', op: 'go', delta: index - history.index });
  }
  events.push(replace(entry.id, path));
  return {
    history: {
      ...history,
      entries: history.entries.map((item, itemIndex) => (itemIndex === index ? entry : item)),
      index,
    },
    events,
  };
}

function replace(id: string, path: string): BrowserHistoryEvent {
  return { type: 'browser-history', op: 'replace', entryId: id, path };
}

function reset(state: NavigationState): ReducibleIntent {
  return {
    type: 'ACTION',
    payload: { action: { type: 'RESET', payload: state, target: state.key } },
  };
}

function stripHash(path: string): string {
  const hashIndex = path.indexOf('#');
  return hashIndex === -1 ? path : path.slice(0, hashIndex);
}

/** Find the matching navigation state that changed between two navigation states. */
function findMatchingState<T extends NavigationState>(
  a: T | undefined,
  b: T | undefined
): [T | undefined, T | undefined] {
  if (a === undefined || b === undefined || a.key !== b.key) {
    return [undefined, undefined];
  }

  const aHistoryLength = getHistoryLength(a);
  const bHistoryLength = getHistoryLength(b);
  const aRoute = a.routes[a.index]!;
  const bRoute = b.routes[b.index]!;
  const aChildState = aRoute.state as T | undefined;
  const bChildState = bRoute.state as T | undefined;

  if (
    aHistoryLength !== bHistoryLength ||
    aRoute.key !== bRoute.key ||
    aChildState === undefined ||
    bChildState === undefined ||
    aChildState.key !== bChildState.key
  ) {
    return [a, b];
  }

  return findMatchingState(aChildState, bChildState);
}
