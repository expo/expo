/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook, act } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';
import { type ReactNode } from 'react';

import { ObserveRouterIntegrationContext } from '../ObserveRouterIntegrationProvider';
import * as routerModule from '../router';
import { createRouterIntegrationStorage, type RouterIntegrationStorage } from '../storage';
import { useObserveForRouter } from '../useObserveForRouter';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSession: jest.fn(() => ({ id: 'session-1' })),
    addCustomMetricToSession: jest.fn(),
  },
}));

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
  };
});

const mockAddCustomMetric = AppMetrics.addCustomMetricToSession as jest.Mock;
const mockUseRoute = (routerModule as unknown as { __useRoute: jest.Mock }).__useRoute;
const mockUseNavigation = (routerModule as unknown as { __useNavigation: jest.Mock })
  .__useNavigation;

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
  storage = createRouterIntegrationStorage();
});

describe('useObserveForRouter (ios)', () => {
  it('calls AppMetrics.markInteractive when the screen is focused', async () => {
    const { result } = renderHook(() => useObserveForRouter());
    const arg = { params: { x: 'payload' } };
    await act(async () => {
      await result.current!({ ...arg });
    });
    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({ ...arg, routeName: '/test' });
  });

  it('does not call AppMetrics.markInteractive when the screen is not focused', async () => {
    mockUseNavigation.mockReturnValue({ isFocused: () => false });
    jest.spyOn(Date, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter());
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
  });

  it('does not record the per-screen TTI metric on iOS', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
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
      "[expo-observe] Router integration was toggled during a screen's lifecycle. Call `ExpoObserve.configure({ disableRouterIntegration })` once at startup before any screen mounts."
    );
  });
});
