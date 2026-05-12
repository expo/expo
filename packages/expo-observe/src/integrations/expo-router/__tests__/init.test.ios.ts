/* eslint-disable @typescript-eslint/no-require-imports */
import AppMetrics from 'expo-app-metrics';
import type { ActionDispatchedEvent, PageFocusedEvent } from 'expo-router';

import { initListeners } from '../init';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from '../storage';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSessionId: jest.fn(() => 'session-1'),
    addCustomMetricToSession: jest.fn(),
  },
}));

jest.mock('../router', () => ({ optionalRouter: undefined, isRouterInstalled: false }));

const mockAddCustomMetric = AppMetrics.addCustomMetricToSession as jest.Mock;

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

let storage: RouterIntegrationStorage;
let events: FakeNavigationEvents;
let cleanup: () => void;
let warnSpy: jest.SpyInstance;
let logSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  storage = createRouterIntegrationStorage();
  events = createFakeNavigationEvents();
  cleanup = initListeners(storage, events as any);
});

afterEach(() => {
  cleanup?.();
});

describe('initListeners (ios)', () => {
  it('does not record the TTR metric on iOS', () => {
    dispatch(events, 'NAVIGATE');
    focus(events, 'a');
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
