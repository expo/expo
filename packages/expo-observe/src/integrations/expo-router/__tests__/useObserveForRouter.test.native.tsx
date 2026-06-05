/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook, act } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';
import { type ReactNode } from 'react';

import { ObserveRouterIntegrationContext } from '../ObserveRouterIntegrationProvider';
import * as routerModule from '../router';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from '../storage';
import { useObserveForRouter } from '../useObserveForRouter';

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

jest.mock('../init', () => ({
  __esModule: true,
  isInitialized: jest.fn(() => true),
  initListeners: jest.fn(() => () => {}),
  initRouterIntegration: jest.fn(),
}));

jest.mock('../router', () => {
  const useRoute = jest.fn(() => ({ key: 'screen-a' }));
  const useNavigation = jest.fn(() => ({ isFocused: () => true }));
  const useCurrentRouteInfo = jest.fn(() => ({
    pathname: '/test',
    params: { x: '1' },
    segments: ['test'],
  }));
  return {
    optionalRouter: {
      useRoute,
      useNavigation,
      useCurrentRouteInfo,
      unstable_navigationEvents: { addListener: jest.fn(), emit: jest.fn() },
    },
    isRouterInstalled: true,
    __useRoute: useRoute,
    __useNavigation: useNavigation,
    __useCurrentRouteInfo: useCurrentRouteInfo,
  };
});

const mockAddMetric = AppMetrics.getMainSession().addMetric as jest.Mock;
const mockUseRoute = (routerModule as unknown as { __useRoute: jest.Mock }).__useRoute;
const mockUseNavigation = (routerModule as unknown as { __useNavigation: jest.Mock })
  .__useNavigation;
const mockUseCurrentRouteInfo = (routerModule as unknown as { __useCurrentRouteInfo: jest.Mock })
  .__useCurrentRouteInfo;

function wrapper(storage: RouterIntegrationStorage | null) {
  return ({ children }: { children: ReactNode }) => (
    <ObserveRouterIntegrationContext.Provider value={storage}>
      {children}
    </ObserveRouterIntegrationContext.Provider>
  );
}

let storage: RouterIntegrationStorage;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  mockUseRoute.mockReturnValue({ key: 'screen-a' });
  mockUseNavigation.mockReturnValue({ isFocused: () => true });
  mockUseCurrentRouteInfo.mockReturnValue({
    pathname: '/test',
    params: { x: '1' },
    segments: ['test'],
  });
  storage = createRouterIntegrationStorage();
});

describe('useObserveForRouter', () => {
  it('records TTI from dispatchTime on the first call when focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: false };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric).toHaveBeenCalledWith({
      timestamp: expect.any(String),
      category: 'navigation',
      routeName: '/test',
      name: 'tti',
      value: 0.3,
      params: { isAppLaunch: false, routeParams: { x: '1' }, url: '/test' },
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
    'useCurrentRouteInfo(segments=%s, pathname=%s, params=%s) records routeName=%s',
    async (segments, pathname, routeParams, expectedRouteName) => {
      mockUseCurrentRouteInfo.mockReturnValue({ pathname, params: routeParams, segments });
      storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
      jest.spyOn(performance, 'now').mockReturnValue(1300);

      const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
      await act(async () => {
        await result.current!();
      });

      expect(AppMetrics.markInteractive).toHaveBeenCalledWith({
        routeName: expectedRouteName,
        params: { url: pathname },
      });
      expect(mockAddMetric).toHaveBeenCalledWith({
        timestamp: expect.any(String),
        category: 'navigation',
        routeName: expectedRouteName,
        name: 'tti',
        value: 0.3,
        params: { isAppLaunch: false, routeParams, url: pathname },
      });
    }
  );

  it('records TTI with isAppLaunch=true when the initial screen was seeded by app launch', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: true };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(mockAddMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'tti',
        value: 0.3,
        params: { isAppLaunch: true, routeParams: { x: '1' }, url: '/test' },
      })
    );
  });

  it('calls AppMetrics.markInteractive when the screen is focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: false };
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    const arg = { params: { x: 'payload' } };
    await act(async () => {
      await result.current!({ ...arg });
    });
    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({
      params: { x: 'payload', url: '/test' },
      routeName: '/test',
    });
  });

  it('records the navigation TTI metric only once when markInteractive is called twice without a new navigation', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: false };
    const nowSpy = jest.spyOn(performance, 'now');

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });

    nowSpy.mockReturnValue(1300);
    await act(async () => {
      await result.current!();
    });
    nowSpy.mockReturnValue(1500);
    await act(async () => {
      await result.current!();
    });

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
  });

  it('does not record TTI metric when the screen is re-focused after navigating away (A → B → A)', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: false };
    const nowSpy = jest.spyOn(performance, 'now');

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });

    nowSpy.mockReturnValue(1300);
    await act(async () => {
      await result.current!();
    });

    // Simulate navigating away to B and back to A: the focus listener would
    // overwrite dispatchTime on screen-a with the new action's dispatch time.
    storage.screenTimes['screen-a'] = {
      ...storage.screenTimes['screen-a'],
      dispatchTime: 2000,
    };

    nowSpy.mockReturnValue(2300);
    await act(async () => {
      await result.current!();
    });

    expect(mockAddMetric).toHaveBeenCalledTimes(1);
    expect(mockAddMetric).toHaveBeenNthCalledWith(1, expect.objectContaining({ value: 0.3 }));
  });

  it('records lastInteractiveCall when the screen is not focused (skips markInteractive and TTI)', async () => {
    mockUseNavigation.mockReturnValue({ isFocused: () => false });
    storage.screenTimes['screen-a'] = { dispatchTime: 1000, isAppLaunch: false };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
    expect(mockAddMetric).not.toHaveBeenCalled();
    expect(storage.screenTimes['screen-a'].lastInteractiveCall).toBe(1300);
    expect(storage.interactiveScreensIds.has('screen-a')).toBe(false);
  });

  it('stores lastInteractiveCall and defers TTI emission when dispatchTime is not yet recorded', async () => {
    // markInteractive runs before the pageFocused handler has seeded dispatchTime.
    jest.spyOn(performance, 'now').mockReturnValue(1234);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).toHaveBeenCalled();
    expect(mockAddMetric).not.toHaveBeenCalled();
    expect(storage.screenTimes['screen-a']).toEqual({ lastInteractiveCall: 1234 });
    expect(storage.interactiveScreensIds.has('screen-a')).toBe(true);
  });

  it('skips TTI calculation silently when no dispatchTime is recorded for the screen', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });
    expect(mockAddMetric).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns and skips when called on an unmounted screen', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const { result, unmount } = renderHook(() => useObserveForRouter(), {
      wrapper: wrapper(storage),
    });
    const fn = result.current!;
    unmount();
    await act(async () => {
      await fn();
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[expo-observe] Calling markInteractive on unmounted screen'
    );
    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
  });

  it('warns when there is no screenId on the route', async () => {
    mockUseRoute.mockReturnValue({ key: undefined });
    const warnSpy = jest.spyOn(console, 'warn');
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });
    expect(warnSpy).toHaveBeenCalledWith(
      '[expo-observe] No metadata available for the current screen. Make sure to call useObserve inside a screen component.'
    );
    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
  });

  it('warns when the screen ID changes between renders', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    mockUseRoute.mockReturnValue({ key: 'screen-a' });
    const { rerender } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });

    mockUseRoute.mockReturnValue({ key: 'screen-b' });
    rerender(undefined);

    expect(warnSpy).toHaveBeenCalledWith(
      '[expo-observe] Screen ID changed between renders. This is most likely an expo-router bug.'
    );
  });

  it('throws when isInitialized() flips mid-lifetime', () => {
    const init = require('../init') as typeof import('../init');
    const isInitMock = init.isInitialized as jest.Mock;
    isInitMock.mockReturnValue(false);
    // Suppress React's own console.error for the unhandled render error so the
    // test output stays focused on the assertion.
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });

    isInitMock.mockReturnValue(true);
    expect(() => rerender(undefined)).toThrow(
      "[expo-observe] Router integration was toggled during a screen's lifecycle. Call `Observe.configure({ integrations: { 'expo-router': true } })` once at startup before any screen mounts."
    );
  });
});
