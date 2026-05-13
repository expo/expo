/* eslint-disable @typescript-eslint/no-require-imports */
import AppMetrics from 'expo-app-metrics';
import type { ActionDispatchedEvent, PageFocusedEvent } from 'expo-router';

import { initListeners } from '../init';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from '../storage';

jest.mock('expo-app-metrics', () => {
  const addCustomMetricToSession = jest.fn();
  const getMainSession = jest.fn(async () => ({ id: 'session-1' }));
  return {
    __esModule: true,
    default: {
      markInteractive: jest.fn(),
      getMainSession,
      addCustomMetricToSession,
    },
  };
});

jest.mock('../router', () => ({ optionalRouter: undefined, isRouterInstalled: false }));

const mockGetMainSession = AppMetrics.getMainSession as jest.Mock;
const mockAddCustomMetric = AppMetrics.addCustomMetricToSession as jest.Mock;
const mockSessionId = 'session-1';

type Listener<T> = (event: T) => void;

interface FakeNavigationEvents {
  addListener<T>(type: string, cb: Listener<T>): () => void;
  emit<T>(type: string, event: T): void;
}

function createFakeNavigationEvents(): FakeNavigationEvents {
  const listeners: Record<string, Set<Listener<any>>> = {};
  return {
    addListener(type, cb) {
      listeners[type] = listeners[type] ?? new Set();
      listeners[type].add(cb);
      return () => listeners[type].delete(cb);
    },
    emit(type, event) {
      listeners[type]?.forEach((cb) => cb(event));
    },
  };
}

function dispatch(events: FakeNavigationEvents, actionType: string) {
  events.emit<Partial<ActionDispatchedEvent>>('actionDispatched', {
    type: 'actionDispatched',
    actionType: actionType as ActionDispatchedEvent['actionType'],
  });
}

function focus(events: FakeNavigationEvents, screenId: string) {
  events.emit<Partial<PageFocusedEvent>>('pageFocused', {
    type: 'pageFocused',
    screenId,
    pathname: `/${screenId}`,
    params: {},
  });
}

function flushAsync() {
  return new Promise((resolve) => setImmediate(resolve));
}

let storage: RouterIntegrationStorage;
let events: FakeNavigationEvents;
let cleanup: () => void;
let logSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  storage = createRouterIntegrationStorage();
  events = createFakeNavigationEvents();
  cleanup = initListeners(storage, events as any);
});

afterEach(() => {
  cleanup?.();
  expect(logSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
  jest.clearAllMocks();
});

describe('initListeners', () => {
  it('records TTR with isAppLaunch=true on the first focus after a non-PRELOAD action', async () => {
    const now = performance.now();
    jest.spyOn(performance, 'now').mockReturnValue(now + 100);
    focus(events, 'a');
    await flushAsync();

    expect(mockAddCustomMetric).toHaveBeenCalledTimes(1);
    expect(mockAddCustomMetric).toHaveBeenCalledWith({
      sessionId: mockSessionId,
      timestamp: expect.any(String),
      category: 'navigation',
      name: 'ttr',
      routeName: '/a',
      value: expect.closeTo(0.1, 2),
      params: { isInitial: true, isAppLaunch: true, routeParams: {} },
    });
  });

  it('records TTR with isAppLaunch=false on subsequent focuses', async () => {
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();
    mockAddCustomMetric.mockClear();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    expect(mockAddCustomMetric).toHaveBeenCalledTimes(1);
    expect(mockAddCustomMetric.mock.calls[0][0].params).toEqual({
      isInitial: true,
      isAppLaunch: false,
      routeParams: {},
    });
  });

  it('records TTR with isInitial=false when revisiting a previously rendered screen', async () => {
    focus(events, 'a');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'b');
    await flushAsync();

    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();

    expect(mockAddCustomMetric).toHaveBeenCalledTimes(3);
    expect(mockAddCustomMetric.mock.calls[0][0].params).toEqual({
      isInitial: true,
      isAppLaunch: true,
      routeParams: {},
    });
    expect(mockAddCustomMetric.mock.calls[1][0].params).toEqual({
      isInitial: true,
      isAppLaunch: false,
      routeParams: {},
    });
    expect(mockAddCustomMetric.mock.calls[2][0].params).toEqual({
      isInitial: false,
      isAppLaunch: false,
      routeParams: {},
    });
  });

  it('does not record a TTR for a PRELOAD action', async () => {
    storage.hasRecordedInitialTtr = true;

    dispatch(events, 'PRELOAD');
    focus(events, 'a');
    await flushAsync();
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
  });

  it('cleanup unsubscribes both listeners', async () => {
    cleanup();
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await flushAsync();
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(storage.pendingActions).toHaveLength(0);
    cleanup = () => {};
  });

  it('uses getMainSession from AppMetrics for the metric session id', async () => {
    mockGetMainSession.mockResolvedValueOnce({ id: 'custom-session' });
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockAddCustomMetric).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 'custom-session' })
    );
  });
});

describe('isInitialized + initRouterIntegration', () => {
  it('flips initialized when initRouterIntegration is called and stays decoupled from initListeners', () => {
    jest.isolateModules(() => {
      const init = require('../init');
      expect(init.isInitialized()).toBe(false);

      const fresh = createRouterIntegrationStorage();
      const fakeEvents = createFakeNavigationEvents();
      const dispose = init.initListeners(fresh, fakeEvents);
      expect(init.isInitialized()).toBe(false);
      dispose();

      init.initRouterIntegration();
      expect(init.isInitialized()).toBe(true);
    });
  });
});
