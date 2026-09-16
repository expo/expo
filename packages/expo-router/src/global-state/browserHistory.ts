import type { NavigationState, RouterBrowserHistoryAction } from '../react-navigation/routers';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
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

/** Applies the handling router's instruction to the owned browser entries. */
export function projectBrowserHistory(
  history: BrowserHistory,
  nextState: NavigationState,
  config: BrowserHistoryConfig,
  action?: RouterBrowserHistoryAction
): BrowserHistoryProjection {
  const path = getPathForState(nextState, config.linking);
  if (action?.type === 'push') {
    return appendEntry(history, nextState, path, 'push');
  }
  if (action?.type === 'pop') {
    return projectPop(history, nextState, path, action);
  }
  return refreshEntry(history, history.index, nextState, path);
}

/** Refreshes the current entry after a structural change that is not a navigation. */
export function refreshBrowserHistory(
  history: BrowserHistory,
  nextState: NavigationState,
  config: BrowserHistoryConfig
): BrowserHistoryProjection {
  return projectBrowserHistory(history, nextState, config);
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

function projectPop(
  history: BrowserHistory,
  state: NavigationState,
  path: string,
  action: Extract<RouterBrowserHistoryAction, { type: 'pop' }>
): BrowserHistoryProjection {
  let index = Math.max(0, history.index - action.count);
  if (action.target) {
    const { navigatorKey, routeKey } = action.target;
    // A single parent pop can remove several entries created by a nested stack.
    // Match only the visible branch; a hidden navigator is not a browser destination.
    for (let candidate = history.index - 1; candidate >= 0; candidate--) {
      let candidateState: NavigationState | undefined = history.entries[candidate]!.state;
      while (candidateState && candidateState.key !== navigatorKey) {
        candidateState = candidateState.routes[candidateState.index]?.state as
          | NavigationState
          | undefined;
      }
      if (candidateState?.routes[candidateState.index]?.key === routeKey) {
        index = candidate;
        break;
      }
    }
  }
  return refreshEntry(history, index, state, path);
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
