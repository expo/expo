import type { NavigationState, RouterBrowserHistoryAction } from '../react-navigation/routers';
import { ROOT_CHAIN } from '../react-navigation/routers/stateKeys';
import type {
  BrowserHistory,
  BrowserHistoryChange,
  BrowserHistoryConfig,
  BrowserHistoryEntry,
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
type PopAction = Extract<RouterBrowserHistoryAction, { type: 'pop' }>;
type PopTarget = NonNullable<PopAction['target']>;

// These functions calculate history state and commands. The adapter runs the commands after commit.

/** Starts tracking the browser entry that is current when the app loads. */
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
    events: [createReplaceEvent(id, path)],
  };
}

/** Updates tracked entries and queues browser commands for an accepted router action. */
export function applyRouterHistoryAction(
  history: BrowserHistory,
  nextState: NavigationState,
  config: BrowserHistoryConfig,
  action?: RouterBrowserHistoryAction
): BrowserHistoryProjection {
  const path = getPathForState(nextState, config.linking);
  if (action?.type === 'push') {
    return addHistoryEntry(history, nextState, path, 'push');
  }
  if (action?.type === 'pop') {
    const index = findBackDestinationIndex(history, action);
    return selectAndUpdateHistoryEntry(history, index, nextState, path);
  }
  // Push and pop change which tracked entry is current, so they need special handling above.
  // `replace` and no instruction both refresh this entry. An explicit `replace` only matters
  // while nested routers compose their instructions, where it can override a child push.
  return selectAndUpdateHistoryEntry(history, history.index, nextState, path);
}

/**
 * Refreshes the current entry after `NAVIGATOR_CHANGED` or `NAVIGATOR_UNMOUNTED`, for example when
 * a navigator registers its routes or is removed from the tree.
 */
export function updateCurrentHistoryEntry(
  history: BrowserHistory,
  nextState: NavigationState,
  config: BrowserHistoryConfig
): BrowserHistoryProjection {
  return applyRouterHistoryAction(history, nextState, config);
}

/**
 * Restores navigation after browser back or forward. Known entries reuse their saved state;
 * unknown entries are rebuilt from the URL and added to the tracked history.
 *
 * @param history Entries tracked by this page, including their navigation snapshots.
 * @param result Current navigation reducer result.
 * @param change Entry ID and URL selected by the browser.
 * @param config Linking and route configuration used to parse the URL.
 * @param reduce Applies the navigation intent produced by the restore.
 */
export function restoreNavigationFromBrowser<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  result: Result,
  change: BrowserHistoryChange,
  config: BrowserHistoryConfig,
  reduce: Reduce<Result>
): BrowserHistoryRestore<Result> {
  const trackedEntry = history.entries.find((entry) => entry.id === change.id);
  if (trackedEntry) {
    return restoreTrackedEntry(history, trackedEntry, result, change, config, reduce);
  }
  return restoreUntrackedEntry(history, result, change, config, reduce);
}

// Router actions: select the back destination, then update the selected entry.

/** Finds the browser entry for the pop target, falling back to the router's pop count. */
function findBackDestinationIndex(history: BrowserHistory, action: PopAction): number {
  const fallbackIndex = Math.max(0, history.index - action.count);
  const { target } = action;
  if (!target) {
    return fallbackIndex;
  }

  // A single parent pop can remove several entries created by a nested stack.
  const targetIndex = history.entries.findLastIndex(
    (entry, index) => index < history.index && isTargetRouteFocused(entry.state, target)
  );
  return targetIndex === -1 ? fallbackIndex : targetIndex;
}

/** Checks whether the target is visible by following only the state's focused route branch. */
function isTargetRouteFocused(state: NavigationState, target: PopTarget): boolean {
  let focusedState: NavigationState | undefined = state;
  while (focusedState && focusedState.key !== target.navigatorKey) {
    focusedState = focusedState.routes[focusedState.index]?.state as NavigationState | undefined;
  }
  return focusedState?.routes[focusedState.index]?.key === target.routeKey;
}

/** Updates the selected snapshot and queues a browser move, if needed, followed by replacement. */
function selectAndUpdateHistoryEntry(
  history: BrowserHistory,
  index: number,
  state: NavigationState,
  path: string
): BrowserHistoryProjection {
  const updatedHistory = updateHistoryEntry(history, index, state, path);
  const events: BrowserHistoryEvent[] = [];
  if (index !== history.index) {
    events.push({ type: 'browser-history', op: 'go', delta: index - history.index });
  }
  events.push(createReplaceEvent(updatedHistory.entries[index]!.id, path));
  return { history: updatedHistory, events };
}

// Browser traversal: restore a saved snapshot when possible, otherwise rebuild it from the URL.

function restoreTrackedEntry<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  trackedEntry: BrowserHistoryEntry,
  result: Result,
  change: BrowserHistoryChange,
  config: BrowserHistoryConfig,
  reduce: Reduce<Result>
): BrowserHistoryRestore<Result> {
  const trackedIndex = history.entries.indexOf(trackedEntry);
  const reduced =
    trackedEntry.path === change.path
      ? reduce(result, createResetIntent(trackedEntry.state))
      : navigateToBrowserPath(history, trackedEntry.path, result, change.path, config, reduce);
  if (reduced.state === result.state) {
    // The restore was prevented, so move the browser back to the entry that matches the UI.
    return {
      result: reduced,
      history,
      events:
        trackedIndex === history.index
          ? []
          : [{ type: 'browser-history', op: 'go', delta: history.index - trackedIndex }],
    };
  }
  const path = getPathForState(reduced.state, config.linking);
  return {
    result: reduced,
    history: updateHistoryEntry(history, trackedIndex, reduced.state, path),
    events: path === change.path ? [] : [createReplaceEvent(trackedEntry.id, path)],
  };
}

function restoreUntrackedEntry<Result extends { state: NavigationState }>(
  history: BrowserHistory,
  result: Result,
  change: BrowserHistoryChange,
  config: BrowserHistoryConfig,
  reduce: Reduce<Result>
): BrowserHistoryRestore<Result> {
  const reduced = navigateToBrowserPath(
    history,
    history.entries[history.index]!.path,
    result,
    change.path,
    config,
    reduce
  );
  const path = getPathForState(reduced.state, config.linking);
  if (change.id === null) {
    // The browser created this entry (e.g. a hash link). Assign an ID without pushing it again.
    return { result: reduced, ...addHistoryEntry(history, reduced.state, path, 'replace') };
  }
  // An ID from a previous page load has no saved snapshot. Start tracking from this entry.
  return {
    result: reduced,
    history: { ...history, entries: [{ id: change.id, path, state: reduced.state }], index: 0 },
    events: [createReplaceEvent(change.id, path)],
  };
}

/** Navigates to a browser URL, preserving route state for hash-only changes. */
function navigateToBrowserPath<Result extends { state: NavigationState }>(
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

  const state = parseNavigationStateFromPath(path, result.state, config);
  // A path outside the app falls back to the first entry.
  return reduce(result, createResetIntent(state ?? history.entries[0]!.state));
}

/** Parses the URL and fills in route keys and initial routes required by the navigation tree. */
function parseNavigationStateFromPath(
  path: string,
  currentState: NavigationState,
  config: BrowserHistoryConfig
): NavigationState | undefined {
  const parsed = resolvePathLinking(config.linking).getStateFromPath(
    path,
    config.linking?.config,
    getRouteInfoFromState(currentState).segments
  );
  const routeNames = getRootStackRouteNames();
  if (!parsed || !parsed.routes.every((route) => routeNames.includes(route.name))) {
    return undefined;
  }
  return config.routeNode
    ? createSeededRootState(parsed, config.routeNode)
    : completeParsedState(parsed, ROOT_CHAIN);
}

// Shared entry updates and command builders.

/** Adds a snapshot and assigns its ID to a new or already-created browser entry. */
function addHistoryEntry(
  history: BrowserHistory,
  state: NavigationState,
  path: string,
  browserOperation: 'push' | 'replace'
): BrowserHistoryProjection {
  const id = `${history.idPrefix}:${history.entrySeq}`;
  // Navigating after Back discards the forward branch: A -> B, Back, then C becomes A -> C.
  const entries = [...history.entries.slice(0, history.index + 1), { id, path, state }];
  return {
    history: { ...history, entries, index: entries.length - 1, entrySeq: history.entrySeq + 1 },
    events: [{ type: 'browser-history', op: browserOperation, entryId: id, path }],
  };
}

/** Replaces a saved snapshot and selects it in memory without emitting browser commands. */
function updateHistoryEntry(
  history: BrowserHistory,
  index: number,
  state: NavigationState,
  path: string
): BrowserHistory {
  if (!Number.isInteger(index) || index < 0 || index >= history.entries.length) {
    throw new Error(
      `Invalid browser history index ${index} for ${history.entries.length} entries.`
    );
  }
  const entries = [...history.entries];
  entries[index] = { ...entries[index]!, path, state };
  return { ...history, entries, index };
}

function createReplaceEvent(id: string, path: string): BrowserHistoryEvent {
  return { type: 'browser-history', op: 'replace', entryId: id, path };
}

function createResetIntent(state: NavigationState): ReducibleIntent {
  return {
    type: 'ACTION',
    payload: { action: { type: 'RESET', payload: state, target: state.key } },
  };
}

function stripHash(path: string): string {
  const hashIndex = path.indexOf('#');
  return hashIndex === -1 ? path : path.slice(0, hashIndex);
}
