/* eslint-disable @typescript-eslint/no-require-imports */
import AppMetrics from 'expo-app-metrics';

import { initListeners, initRouterIntegration } from '../init';
import type { RouterPerformanceMark, RouterPerformanceObserver } from '../router';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from '../storage';

jest.mock('expo-app-metrics', () => {
  const mainSession = {
    id: 'session-1',
    type: 'main',
    startDate: '2026-01-01T00:00:00.000Z',
    addMetric: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      markInteractive: jest.fn(),
      getMainSession: jest.fn(() => mainSession),
    },
  };
});

jest.mock('../router', () => ({ optionalRouter: undefined, isRouterInstalled: false }));

const mockGetMainSession = AppMetrics.getMainSession as jest.Mock;
const mockAddMetric = AppMetrics.getMainSession().addMetric as jest.Mock;

type ObserverCallback = ConstructorParameters<RouterPerformanceObserver>[0];

interface FakeRouterPerformance {
  PerformanceObserver: RouterPerformanceObserver;
  mark(name: RouterPerformanceMark['name'], detail: object, startTime?: number): void;
}

function createFakeRouterPerformance(): FakeRouterPerformance {
  const callbacks = new Set<ObserverCallback>();
  return {
    PerformanceObserver: class {
      constructor(private callback: ObserverCallback) {}
      observe() {
        callbacks.add(this.callback);
      }
      disconnect() {
        callbacks.delete(this.callback);
      }
    },
    mark(name, detail, startTime = performance.now()) {
      // Tests pass partial or loosely typed details to cover edge cases.
      const entries = [{ name, startTime, detail } as RouterPerformanceMark];
      callbacks.forEach((callback) => callback({ getEntries: () => entries }));
    },
  };
}

function dispatch(events: FakeRouterPerformance, actionType: string, startTime?: number) {
  events.mark('expo-router:action-dispatched', { actionType }, startTime);
}

function pageDetail(screenId: string, overrides?: object) {
  return { screenId, pathname: `/${screenId}`, params: {}, segments: [screenId], ...overrides };
}

function focus(
  events: FakeRouterPerformance,
  screenId: string,
  overrides?: object,
  startTime?: number
) {
  events.mark('expo-router:page-focused', pageDetail(screenId, overrides), startTime);
}

function preload(events: FakeRouterPerformance, screenId: string) {
  events.mark('expo-router:page-preloaded', pageDetail(screenId));
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

let storage: RouterIntegrationStorage;
let events: FakeRouterPerformance;
let cleanup: () => void;
let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  initRouterIntegration(undefined);
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  storage = createRouterIntegrationStorage();
  events = createFakeRouterPerformance();
  cleanup = initListeners(storage, events.PerformanceObserver);
});

function setRouterConfig(config: Parameters<typeof initRouterIntegration>[0]) {
  cleanup?.();
  initRouterIntegration(config);
  cleanup = initListeners(storage, events.PerformanceObserver);
}

afterEach(() => {
  cleanup?.();
  expect(logSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  jest.clearAllMocks();
});

describe('initListeners', () => {
  it('records cold_ttr with isAppLaunch=true on the first focus after a non-PRELOAD action', async () => {
    focus(events, 'a', undefined, performance.now() + 100);
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      category: 'navigation',
      name: 'cold_ttr',
      routeName: '/a',
      value: expect.closeTo(0.1, 2),
      params: { isAppLaunch: true, routeParams: {}, url: '/a' },
    });
  });

  it('filters route params from cold_ttr, warm_ttr, and deferred tti metrics', async () => {
    setRouterConfig({ filteredParams: ['userId', 'token'] });
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    storage.screenTimes['b'] = { lastInteractiveCall: performance.now() };

    focus(events, 'a', { params: { userId: '1', tab: 'home', callback: () => {}, circular } });
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b', {
      pathname: '/b?token=secret',
      params: { token: 'secret', q: 'ok', callback: () => {}, circular },
    });
    await flushAsync();

    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: true,
      routeParams: { tab: 'home' },
      urlHidden: true,
    });
    expect(mockAddMetric.mock.calls[1][0].params).toEqual({
      isAppLaunch: false,
      routeParams: { q: 'ok' },
      urlHidden: true,
    });
    expect(mockAddMetric.mock.calls[2][0].params).toEqual({
      isAppLaunch: false,
      routeParams: { q: 'ok' },
      urlHidden: true,
    });
  });

  it('keeps URL visible when filteredParams does not remove any route param', async () => {
    setRouterConfig({ filteredParams: ['userId'] });
    storage.screenTimes['a'] = { lastInteractiveCall: performance.now() };

    focus(events, 'a', { pathname: '/a?token=secret', params: { token: 'secret' } });
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: true,
      routeParams: { token: 'secret' },
      url: '/a?token=secret',
    });
    expect(mockAddMetric.mock.calls[1][0].params).toEqual({
      isAppLaunch: true,
      routeParams: { token: 'secret' },
      url: '/a?token=secret',
    });
  });

  it('seeds dispatchTime and isAppLaunch=true for the initial screen so a later markInteractive can compute navigation TTI', async () => {
    focus(events, 'a');
    await flushAsync();

    // The initial focus is treated as if the app launch dispatched the
    // navigation — without this, useObserveForRouter has no dispatchTime to
    // diff against and the navigation `tti` metric is silently skipped.
    expect(storage.screenTimes['a']).toEqual({
      dispatchTime: expect.any(Number),
      isAppLaunch: true,
    });
  });

  it('seeds isAppLaunch=false on subsequent navigated focuses so markInteractive can label the tti metric', async () => {
    focus(events, 'a');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    expect(storage.screenTimes['b']).toEqual({
      dispatchTime: expect.any(Number),
      isAppLaunch: false,
    });
  });

  it('measures TTR between the startTime of the action and focus marks', async () => {
    storage.hasRecordedInitialTtr = true;

    dispatch(events, 'NAVIGATE', 1000);
    focus(events, 'a', undefined, 1250);
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledWith(expect.objectContaining({ value: 0.25 }));
    expect(storage.screenTimes['a']?.dispatchTime).toBe(1000);
  });

  it('records cold_ttr with isAppLaunch=false on subsequent focuses of a new screen', async () => {
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();
    mockAddMetric.mockClear();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: false,
      routeParams: {},
      url: '/b',
    });
  });

  it('records warm_ttr when revisiting a previously rendered screen', async () => {
    focus(events, 'a');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(3);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[0][0].params).toEqual({
      isAppLaunch: true,
      routeParams: {},
      url: '/a',
    });
    expect(mockAddMetric.mock.calls[1][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[1][0].params).toEqual({
      isAppLaunch: false,
      routeParams: {},
      url: '/b',
    });
    expect(mockAddMetric.mock.calls[2][0].name).toBe('warm_ttr');
    expect(mockAddMetric.mock.calls[2][0].params).toEqual({
      isAppLaunch: false,
      routeParams: {},
      url: '/a',
    });
  });

  it.each<[string[], string, Record<string, string | string[]>, string]>([
    [[], '/', {}, '/'],
    [['(tabs)'], '/', {}, '/(tabs)'],
    [['(tabs)', '(home)'], '/', {}, '/(tabs)/(home)'],
    [['users', '[id]'], '/users/42', { id: '42' }, '/users/[id]'],
    [['files', '[...path]'], '/files/a/b/c', { path: ['a', 'b', 'c'] }, '/files/[...path]'],
    [
      ['(tabs)', 'sessions', '[sessionId]'],
      '/sessions/1234',
      { sessionId: '1234' },
      '/(tabs)/sessions/[sessionId]',
    ],
  ])(
    'pageFocused(segments=%s, pathname=%s, params=%s) records routeName=%s',
    async (segments, pathname, routeParams, expectedRouteName) => {
      dispatch(events, 'NAVIGATE');
      focus(events, 'screen', { pathname, params: routeParams, segments });
      await flushAsync();

      expect(mockAddMetric).toHaveBeenCalledTimes(1);
      expect(mockAddMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          routeName: expectedRouteName,
          params: expect.objectContaining({
            url: pathname,
            routeParams,
          }),
        })
      );
    }
  );

  it('does not record a TTR for a PRELOAD action', async () => {
    storage.hasRecordedInitialTtr = true;

    dispatch(events, 'PRELOAD');
    focus(events, 'a');
    await flushAsync();
    expect(mockAddMetric).not.toHaveBeenCalled();
  });

  it('records warm_ttr when a preloaded screen is focused for the first time', async () => {
    dispatch(events, 'PRELOAD');
    preload(events, 'a');
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('warm_ttr');
  });

  it('records cold_ttr for a non-preloaded screen even when a different screen was preloaded', async () => {
    dispatch(events, 'PRELOAD');
    preload(events, 'a');
    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('cold_ttr');
  });

  it('does not emit a metric when a screen is preloaded but never focused', async () => {
    storage.hasRecordedInitialTtr = true;

    dispatch(events, 'PRELOAD');
    preload(events, 'a');
    await flushAsync();

    expect(mockAddMetric).not.toHaveBeenCalled();
    expect(storage.renderedScreensIds.has('a')).toBe(true);
  });

  it('handles a duplicate pagePreloaded for the same screen idempotently', async () => {
    preload(events, 'a');
    preload(events, 'a');
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('warm_ttr');
    expect(storage.renderedScreensIds.size).toBe(1);
  });

  it('treats subsequent focuses of a preloaded screen as warm_ttr', async () => {
    preload(events, 'a');
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(3);
    expect(mockAddMetric.mock.calls[0][0].name).toBe('warm_ttr');
    expect(mockAddMetric.mock.calls[1][0].name).toBe('cold_ttr');
    expect(mockAddMetric.mock.calls[2][0].name).toBe('warm_ttr');
  });

  it('cleanup unsubscribes all listeners', async () => {
    cleanup();
    dispatch(events, 'NAVIGATE');
    preload(events, 'a');
    focus(events, 'a');
    await flushAsync();
    expect(mockAddMetric).not.toHaveBeenCalled();
    expect(storage.pendingActions).toHaveLength(0);
    expect(storage.renderedScreensIds.size).toBe(0);
    cleanup = () => {};
  });

  it('emits tti alongside the TTR when a pending interactive was waiting (post-cold-launch)', async () => {
    // Cold-launch first screen so the next focus runs through the warm branch.
    focus(events, 'a');
    await flushAsync();
    mockAddMetric.mockClear();

    // markInteractive ran before pageFocused — wrote lastInteractiveCall with
    // no dispatchTime.
    storage.screenTimes['b'] = { lastInteractiveCall: performance.now() };

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    const ttrCall = mockAddMetric.mock.calls[0][0];
    const ttiCall = mockAddMetric.mock.calls[1][0];
    expect(ttrCall.name).toBe('cold_ttr');
    expect(ttrCall.params.isAppLaunch).toBe(false);
    expect(ttiCall.name).toBe('tti');
    expect(ttiCall.value).toBe(ttrCall.value);
    expect(ttiCall.routeName).toBe('/b');
    expect(ttiCall.params).toEqual({ isAppLaunch: false, routeParams: {}, url: '/b' });
    expect(storage.interactiveScreensIds.has('b')).toBe(true);
  });

  it('emits tti = cold_ttr when a pending interactive was waiting during cold launch', async () => {
    storage.screenTimes['a'] = { lastInteractiveCall: performance.now() };

    focus(events, 'a');
    await flushAsync();

    expect(mockAddMetric).toHaveBeenCalledTimes(2);
    const ttrCall = mockAddMetric.mock.calls.find((c) => c[0].name === 'cold_ttr')?.[0];
    const ttiCall = mockAddMetric.mock.calls.find((c) => c[0].name === 'tti')?.[0];
    expect(ttrCall.params.isAppLaunch).toBe(true);
    expect(ttiCall.value).toBe(ttrCall.value);
    expect(ttiCall.routeName).toBe('/a');
    expect(ttiCall.params).toEqual({ isAppLaunch: true, routeParams: {}, url: '/a' });
    expect(storage.interactiveScreensIds.has('a')).toBe(true);
  });

  it('marks lastInteractiveCall after a deferred emit so a follow-up markInteractive is deduped', async () => {
    storage.hasRecordedInitialTtr = true;
    storage.screenTimes['b'] = { lastInteractiveCall: 1000 };

    dispatch(events, 'NAVIGATE', 2000);
    focus(events, 'b', undefined, 2100);
    await flushAsync();

    // After pageFocused: dispatchTime < lastInteractiveCall (now), so a
    // follow-up markInteractive after focus is treated as duplicate.
    const entry = storage.screenTimes['b'];
    expect(entry?.dispatchTime).toBe(2000);
    expect(entry?.lastInteractiveCall).toBe(2100);
  });

  it('records metrics against the session returned by getMainSession', async () => {
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockGetMainSession).toHaveBeenCalled();
    expect(mockAddMetric).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'cold_ttr', routeName: '/a' })
    );
  });
});

describe('isInitialized + initRouterIntegration', () => {
  it('flips initialized when initRouterIntegration is called and stays decoupled from initListeners', () => {
    jest.isolateModules(() => {
      const init = require('../init');
      expect(init.isInitialized()).toBe(false);

      const fresh = createRouterIntegrationStorage();
      const dispose = init.initListeners(fresh, createFakeRouterPerformance().PerformanceObserver);
      expect(init.isInitialized()).toBe(false);
      dispose();

      init.initRouterIntegration();
      expect(init.isInitialized()).toBe(true);
    });
  });
});
