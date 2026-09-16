import { getStateFromPath } from '../../link/linking';
import type { NavigationState } from '../../react-navigation/routers';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import { getMockConfig } from '../../testing-library/mock-config';
import {
  createBrowserHistory,
  projectBrowserHistory,
  refreshBrowserHistory,
  restoreBrowserHistory,
} from '../browserHistory';
import type { BrowserHistory, ReducibleIntent } from '../browserHistoryTypes';
import { completeParsedState } from '../createSeededNavigationState';
import { getRouteInfoFromState } from '../getRouteInfoFromState';

jest.mock('../getPathForState', () => ({
  ...jest.requireActual<typeof import('../getPathForState')>('../getPathForState'),
  getPathForState: (state: NavigationState) => `/${state.routes[state.index]!.name}`,
}));
jest.mock('../getRouteInfoFromState', () => {
  const actual = jest.requireActual<typeof import('../getRouteInfoFromState')>(
    '../getRouteInfoFromState'
  );
  return {
    ...actual,
    // The simple test states below have no `__root` slot.
    getRouteInfoFromState: (state: NavigationState) =>
      state.routes[0]!.name === '__root'
        ? actual.getRouteInfoFromState(state)
        : { segments: [state.routes[state.index]!.name] },
  };
});

const config = { browserHistoryIdPrefix: 'p' };

function stack(names: string[], index = names.length - 1, key = 'root'): NavigationState {
  return {
    stale: false,
    type: 'stack',
    key,
    routeKeySeq: 0,
    index,
    routeNames: ['a', 'b', 'c'],
    routes: names.map((name) => ({ key: name, name })),
  };
}

function history(states: NavigationState[], index = states.length - 1): BrowserHistory {
  return {
    entries: states.map((state, entryIndex) => ({
      id: `p:${entryIndex}`,
      path: `/${state.routes[state.index]!.name}`,
      state,
    })),
    index,
    idPrefix: 'p',
    entrySeq: states.length,
  };
}

const reset = (state: NavigationState): ReducibleIntent => ({
  type: 'ACTION',
  payload: { action: { type: 'RESET', payload: state, target: state.key } },
});

// Applies resets like the real reducer does: the payload becomes the state.
const reduceResets = jest.fn((result: { state: NavigationState }, intent: ReducibleIntent) => ({
  state:
    intent.type === 'ACTION' ? (intent.payload.action.payload as NavigationState) : result.state,
}));

beforeEach(() => {
  reduceResets.mockClear();
});

test('creates one owned entry and claims the browser entry', () => {
  const state = stack(['a']);

  expect(createBrowserHistory(state, config)).toEqual({
    history: { entries: [{ id: 'p:0', path: '/a', state }], index: 0, idPrefix: 'p', entrySeq: 1 },
    events: [{ type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/a' }],
  });
});

test('pushes an entry and drops forward entries when instructed to push', () => {
  const previous = stack(['a']);
  const next = stack(['a', 'c']);
  const current = history([previous, stack(['a', 'b'])], 0);

  const result = projectBrowserHistory(current, next, config, { type: 'push' });

  expect(result.history).toEqual({
    entries: [current.entries[0], { id: 'p:2', path: '/c', state: next }],
    index: 1,
    idPrefix: 'p',
    entrySeq: 3,
  });
  expect(result.events).toEqual([
    { type: 'browser-history', op: 'push', entryId: 'p:2', path: '/c' },
  ]);
});

test('goes back and refreshes the entry when instructed to pop', () => {
  const previous = stack(['a', 'b', 'c']);
  const next = stack(['a']);
  const current = history([stack(['a']), stack(['a', 'b']), previous]);

  const result = projectBrowserHistory(current, next, config, { type: 'pop', count: 2 });

  expect(result.history?.index).toBe(0);
  expect(result.history?.entries[0]).toEqual({ id: 'p:0', path: '/a', state: next });
  expect(result.history?.entries).toHaveLength(3);
  expect(result.events).toEqual([
    { type: 'browser-history', op: 'go', delta: -2 },
    { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/a' },
  ]);
});

test('clamps a traversal at the first owned entry', () => {
  const previous = stack(['a', 'b', 'c']);
  const next = stack(['a']);
  const current = history([previous]);

  const result = projectBrowserHistory(current, next, config, { type: 'pop', count: 2 });

  expect(result.history?.index).toBe(0);
  expect(result.events).toEqual([
    { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/a' },
  ]);
});

test('replaces the current entry without a history instruction', () => {
  const previous = stack(['a', 'b']);
  const next: NavigationState = {
    ...previous,
    routes: [previous.routes[0]!, { key: 'b', name: 'b', params: { x: '1' } }],
  };
  const current = history([stack(['a']), previous]);

  const result = projectBrowserHistory(current, next, config);

  expect(result.history?.index).toBe(1);
  expect(result.history?.entries[1]).toEqual({ id: 'p:1', path: '/b', state: next });
  expect(result.events).toEqual([
    { type: 'browser-history', op: 'replace', entryId: 'p:1', path: '/b' },
  ]);
});

test('does not push for a preloaded route', () => {
  const previous = stack(['a']);
  const next = stack(['a', 'b'], 0);
  const current = history([previous]);

  const result = projectBrowserHistory(current, next, config);

  expect(result.events).toEqual([
    { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/a' },
  ]);
});

test('replaces when the root navigator changed identity', () => {
  const previous = stack(['a']);
  const next = stack(['a', 'b'], 1, 'other-root');
  const current = history([previous]);

  const result = projectBrowserHistory(current, next, config);

  expect(result.events).toEqual([
    { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/b' },
  ]);
});

test('refreshes without moving the browser after a structural change', () => {
  const previous = stack(['a', 'b', 'c']);
  const next = stack(['a']);
  const current = history([stack(['a']), stack(['a', 'b']), previous]);

  const result = refreshBrowserHistory(current, next, config);

  expect(result.history?.index).toBe(2);
  expect(result.history?.entries[2]).toEqual({ id: 'p:2', path: '/a', state: next });
  expect(result.events).toEqual([
    { type: 'browser-history', op: 'replace', entryId: 'p:2', path: '/a' },
  ]);
});

describe('restore', () => {
  test('restores an owned entry without browser commands', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'p:0', path: '/a' },
      config,
      reduceResets
    );

    expect(reduceResets).toHaveBeenCalledWith({ state: second }, reset(first));
    expect(restored.result.state).toBe(first);
    expect(restored.history).toEqual({
      ...current,
      entries: [{ id: 'p:0', path: '/a', state: first }, current.entries[1]],
      index: 0,
    });
    expect(restored.events).toEqual([]);
  });

  test('corrects the address bar when the restored state has another path', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);
    const redirected = stack(['c']);
    const reduce = jest.fn(() => ({ state: redirected }));

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'p:0', path: '/a' },
      config,
      reduce
    );

    expect(restored.history?.entries[0]).toEqual({ id: 'p:0', path: '/c', state: redirected });
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/c' },
    ]);
  });

  test('moves the browser back to the current entry when restoring is prevented', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);
    const result = { state: second };
    const reduce = jest.fn(() => result);

    const restored = restoreBrowserHistory(
      current,
      result,
      { id: 'p:0', path: '/a' },
      config,
      reduce
    );

    expect(restored.history).toBe(current);
    expect(restored.events).toEqual([{ type: 'browser-history', op: 'go', delta: 1 }]);
  });

  test('emits nothing when a prevented restore targets the current entry', () => {
    const first = stack(['a']);
    const current = history([first]);
    const result = { state: first };

    const restored = restoreBrowserHistory(
      current,
      result,
      { id: 'p:0', path: '/a' },
      config,
      jest.fn(() => result)
    );

    expect(restored).toEqual({ result, history: current, events: [] });
  });

  test('keeps the owned entries when an owned entry has another browser path', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);
    const withHash: NavigationState = {
      ...first,
      routes: [{ key: 'a', name: 'a', params: { '#': 'section' } }],
    };
    const reduce = jest.fn(() => ({ state: withHash }));

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'p:0', path: '/a#section' },
      config,
      reduce
    );

    expect(reduce).toHaveBeenCalledWith(
      { state: second },
      {
        type: 'NAVIGATE_TO_HREF',
        payload: { href: '/a#section', options: { event: 'NAVIGATE' } },
      }
    );
    expect(restored.history).toEqual({
      ...current,
      entries: [{ id: 'p:0', path: '/a', state: withHash }, current.entries[1]],
      index: 0,
    });
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'p:0', path: '/a' },
    ]);
  });

  test('claims a browser-created hash entry and navigates to the href', () => {
    const first = stack(['a']);
    const current = history([first]);
    const withHash: NavigationState = {
      ...first,
      routes: [{ key: 'a', name: 'a', params: { '#': 'section' } }],
    };
    const reduce = jest.fn(() => ({ state: withHash }));

    const restored = restoreBrowserHistory(
      current,
      { state: first },
      { id: null, path: '/a#section' },
      config,
      reduce
    );

    expect(reduce).toHaveBeenCalledWith(
      { state: first },
      {
        type: 'NAVIGATE_TO_HREF',
        payload: { href: '/a#section', options: { event: 'NAVIGATE' } },
      }
    );
    expect(restored.history).toEqual({
      entries: [current.entries[0], { id: 'p:1', path: '/a', state: withHash }],
      index: 1,
      idPrefix: 'p',
      entrySeq: 2,
    });
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'p:1', path: '/a' },
    ]);
  });

  test('adopts an entry from a previous page load', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);
    const getStateFromPath = jest.fn(() => ({ routes: [{ name: '__root' }] }));

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'old:3', path: '/c' },
      { ...config, linking: { getStateFromPath, getPathFromState: jest.fn() } },
      reduceResets
    );

    expect(getStateFromPath).toHaveBeenCalledWith('/c', undefined, ['b']);
    expect(reduceResets.mock.calls[0]![1]).toMatchObject({
      type: 'ACTION',
      payload: { action: { type: 'RESET', payload: { routes: [{ name: '__root' }] } } },
    });
    expect(restored.history).toEqual({
      ...current,
      entries: [{ id: 'old:3', path: '/__root', state: restored.result.state }],
      index: 0,
    });
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'old:3', path: '/__root' },
    ]);
  });

  test('keeps the current route group when parsing a browser path', () => {
    const linkingConfig = getMockConfig(['(a)/shared', '(b)/shared', '(a)/index', '(b)/other']);
    const currentState = completeParsedState(
      getStateFromPath('/other', linkingConfig, ['(b)', 'other']),
      ROOT_CHAIN
    )!;
    expect(getRouteInfoFromState(currentState).segments).toEqual(['(b)', 'other']);
    const current: BrowserHistory = {
      entries: [{ id: 'p:0', path: '/other', state: currentState }],
      index: 0,
      idPrefix: 'p',
      entrySeq: 1,
    };

    const restored = restoreBrowserHistory(
      current,
      { state: currentState },
      { id: 'old:3', path: '/shared' },
      {
        ...config,
        linking: { config: linkingConfig, getStateFromPath, getPathFromState: jest.fn() },
      },
      reduceResets
    );

    expect(getRouteInfoFromState(restored.result.state).segments).toEqual(['(b)', 'shared']);
  });

  test('falls back to the first entry when the path cannot be parsed', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'old:3', path: '/nope' },
      {
        ...config,
        linking: { getStateFromPath: jest.fn(() => undefined), getPathFromState: jest.fn() },
      },
      reduceResets
    );

    expect(reduceResets).toHaveBeenCalledWith({ state: second }, reset(first));
    expect(restored.history?.entries).toEqual([{ id: 'old:3', path: '/a', state: first }]);
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'old:3', path: '/a' },
    ]);
  });

  test('falls back to the first entry for a path outside the root routes', () => {
    const first = stack(['a']);
    const second = stack(['a', 'b']);
    const current = history([first, second]);

    const restored = restoreBrowserHistory(
      current,
      { state: second },
      { id: 'old:3', path: '/nope' },
      {
        ...config,
        linking: {
          getStateFromPath: jest.fn(() => ({ routes: [{ name: 'nope' }] })),
          getPathFromState: jest.fn(),
        },
      },
      reduceResets
    );

    expect(reduceResets).toHaveBeenCalledWith({ state: second }, reset(first));
    expect(restored.events).toEqual([
      { type: 'browser-history', op: 'replace', entryId: 'old:3', path: '/a' },
    ]);
  });
});

test('pops to the owned target instead of counting nested entries as parent routes', () => {
  const first = stack(['a']);
  const child = stack(['a'], 0, 'child');
  const nested = {
    ...stack(['a', 'b']),
    routes: [first.routes[0]!, { key: 'b', name: 'b', state: child }],
  };
  const details = {
    ...nested,
    routes: [first.routes[0]!, { ...nested.routes[1]!, state: stack(['a', 'b'], 1, 'child') }],
  };
  const current = history([first, nested, details]);
  const result = projectBrowserHistory(current, first, config, {
    type: 'pop',
    count: 1,
    target: { navigatorKey: 'root', routeKey: 'a' },
  });
  expect(result.history?.index).toBe(0);
  expect(result.events[0]).toEqual({ type: 'browser-history', op: 'go', delta: -2 });
});
