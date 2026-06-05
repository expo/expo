import AppMetrics from 'expo-app-metrics';

import { createStateChangeHandler } from '../handleStateChange';
import {
  createReactNavigationIntegrationStorage,
  type ReactNavigationIntegrationStorage,
} from '../storage';
import type { GetPathname, NavigationRouteLike, NavigationStateLike } from '../types';

jest.mock('expo-app-metrics', () => {
  const mainSession = {
    id: 'session-1',
    type: 'main',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: null,
    isActive: true,
    hasCrashReport: false,
    addMetric: jest.fn(async () => {}),
  };
  return {
    __esModule: true,
    default: {
      markInteractive: jest.fn(),
      getMainSession: jest.fn(() => mainSession),
    },
  };
});

const mockAddMetric = (AppMetrics.getMainSession() as unknown as { addMetric: jest.Mock })
  .addMetric;

const getPathname: GetPathname = (state) => {
  if (!state) return undefined;
  let current: NavigationStateLike | undefined = state;
  while (current) {
    const route: NavigationRouteLike | undefined = current.routes[
      current.index ?? 0
    ] as NavigationRouteLike;
    if (!route) return undefined;
    if (!route.state) return `/${route.name}`;
    current = route.state;
  }
  return undefined;
};

function stackState(
  routes: { key: string; name?: string; params?: object }[],
  index = routes.length - 1
): NavigationStateLike {
  return {
    type: 'stack',
    index,
    routes: routes.map((r) => ({ key: r.key, name: r.name ?? r.key, params: r.params })),
    routeNames: [],
    stale: false,
    key: 'test',
  };
}

function tabState(routes: { key: string; name?: string }[], index: number): NavigationStateLike {
  return {
    type: 'tab',
    index,
    routes: routes.map((r) => ({ key: r.key, name: r.name ?? r.key })),
    routeNames: [],
    stale: false,
    key: 'test',
  };
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

let storage: ReactNavigationIntegrationStorage;
let handle: (state: NavigationStateLike | undefined) => void;
let appLaunchTime: number;
let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  storage = createReactNavigationIntegrationStorage();
  appLaunchTime = performance.now();
  handle = createStateChangeHandler(storage, getPathname, appLaunchTime);
});

afterEach(() => {
  expect(logSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
});

describe('createStateChangeHandler', () => {
  it('records cold_ttr with isAppLaunch=true on the first focused state', async () => {
    jest.spyOn(performance, 'now').mockReturnValue(appLaunchTime + 100);
    handle(stackState([{ key: 'a' }]));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      category: 'navigation',
      name: 'cold_ttr',
      routeName: '/a',
      value: expect.closeTo(0.1, 2),
      params: { isAppLaunch: true, routeParams: {} },
    });
  });

  it('records cold_ttr with isAppLaunch=false on subsequent navigations to a new screen', async () => {
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();
    mockAddMetric.mockClear();

    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime: performance.now() });
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: false,
      routeParams: {},
    });
  });

  it('records warm_ttr when revisiting a previously focused screen', async () => {
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime: performance.now() });
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    storage.pendingActions.push({ actionType: 'GO_BACK', dispatchTime: performance.now() });
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(3);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[0][0].params.isAppLaunch).toBe(true);
    expect(mockAddMetric.mock.calls[1][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[1][0].params.isAppLaunch).toBe(false);
    expect(mockAddMetric.mock.calls[2][0].name).toBe('warm_ttr');
  });

  it('does not emit when the focused key is unchanged (param-only state update)', async () => {
    handle(stackState([{ key: 'a' }]));
    await flushAsync();
    mockAddMetric.mockClear();

    handle(stackState([{ key: 'a', params: { x: '1' } }]));
    await flushAsync();
    expect(mockAddMetric).not.toHaveBeenCalled();
  });

  it('emits cold_ttr for first focus of each tab; tab siblings are not preemptively marked', async () => {
    handle(tabState([{ key: 'home' }, { key: 'settings' }], 0));
    await flushAsync();
    mockAddMetric.mockClear();

    storage.pendingActions.push({ actionType: 'JUMP_TO', dispatchTime: performance.now() });
    handle(tabState([{ key: 'home' }, { key: 'settings' }], 1));
    await flushAsync();

    storage.pendingActions.push({ actionType: 'JUMP_TO', dispatchTime: performance.now() });
    handle(tabState([{ key: 'home' }, { key: 'settings' }], 0));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[1][0].name).toBe('warm_ttr');
  });

  it('passes the focused route params through as routeParams on the emitted metric', async () => {
    handle(stackState([{ key: 'a', name: 'A', params: { id: '42' } }]));
    await flushAsync();

    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: true,
      routeParams: { id: '42' },
    });
  });

  it('backfills dispatchTime on every mounted screen during a warm focus change', async () => {
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    const dispatchTime = performance.now();
    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime });
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    expect(storage.screenTimes['a']?.dispatchTime).toBe(appLaunchTime);
    expect(storage.screenTimes['b']?.dispatchTime).toBe(dispatchTime);
  });

  it('treats undefined state as a no-op', async () => {
    handle(undefined);
    await flushAsync();
    expect(mockAddMetric).not.toHaveBeenCalled();
  });

  it('adds non-focused mounted stack screens to renderedScreensIds so revisits become warm_ttr', async () => {
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();
    expect(storage.renderedScreensIds.has('a')).toBe(true);
    expect(storage.renderedScreensIds.has('b')).toBe(true);

    mockAddMetric.mockClear();
    storage.pendingActions.push({ actionType: 'GO_BACK', dispatchTime: performance.now() });
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('warm_ttr');
  });

  it('emits tti alongside the TTR when a pending interactive was waiting (post-cold-launch)', async () => {
    // Cold-launch the first screen so the next focus runs through the warm branch.
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();
    mockAddMetric.mockClear();

    // markInteractive ran before onStateChange — wrote lastInteractiveCall
    // with no dispatchTime.
    storage.screenTimes['b'] = { lastInteractiveCall: performance.now() };

    const dispatchTime = performance.now();
    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime });
    jest.spyOn(performance, 'now').mockReturnValue(dispatchTime + 50);
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    const ttrCall = mockAddMetric.mock.calls[0][0];
    const ttiCall = mockAddMetric.mock.calls[1][0];
    expect(ttrCall.name).toBe('cold_ttr');
    expect(ttrCall.params.isAppLaunch).toBe(false);
    expect(ttiCall.name).toBe('tti');
    expect(ttiCall.value).toBe(ttrCall.value);
    expect(ttiCall.routeName).toBe('/b');
    expect(ttiCall.params).toEqual({ routeParams: {} });
  });

  it('emits tti = cold_ttr when a pending interactive was waiting during cold launch', async () => {
    storage.screenTimes['a'] = { lastInteractiveCall: performance.now() };
    jest.spyOn(performance, 'now').mockReturnValue(appLaunchTime + 200);
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    const ttrCall = mockAddMetric.mock.calls.find((c) => c[0].name === 'cold_ttr')?.[0];
    const ttiCall = mockAddMetric.mock.calls.find((c) => c[0].name === 'tti')?.[0];
    expect(ttrCall.params.isAppLaunch).toBe(true);
    expect(ttiCall.value).toBe(ttrCall.value);
    expect(ttiCall.routeName).toBe('/a');
  });

  it('marks lastInteractiveCall after a deferred emit so a follow-up markInteractive is deduped', async () => {
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();

    storage.screenTimes['b'] = { lastInteractiveCall: 1000 };
    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime: 2000 });
    jest.spyOn(performance, 'now').mockReturnValue(2100);
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    // After handleStateChange: lastInteractiveCall > dispatchTime, which
    // satisfies the duplicate-detection branch in useObserveForReactNavigation
    // (`dispatchTime < previousInteractiveCall`).
    const entry = storage.screenTimes['b'];
    expect(entry?.dispatchTime).toBe(2000);
    expect(entry?.lastInteractiveCall).toBe(2100);
    expect(entry!.dispatchTime!).toBeLessThan(entry!.lastInteractiveCall!);
  });

  it('does not emit tti when no pending interactive is waiting', async () => {
    handle(stackState([{ key: 'a' }], 0));
    await flushAsync();
    mockAddMetric.mockClear();

    storage.pendingActions.push({ actionType: 'NAVIGATE', dispatchTime: performance.now() });
    handle(stackState([{ key: 'a' }, { key: 'b' }], 1));
    await flushAsync();

    const ttiCalls = mockAddMetric.mock.calls.filter((c) => c[0].name === 'tti');
    expect(ttiCalls).toHaveLength(0);
  });
});
