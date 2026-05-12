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
  mockUseRoute.mockReturnValue({ key: 'screen-a' });
  mockUseNavigation.mockReturnValue({ isFocused: () => true });
  storage = createRouterIntegrationStorage();
});

describe('useObserveForRouter (android)', () => {
  it('records TTI from dispatchTime on the first call when focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(mockAddCustomMetric).toHaveBeenCalledTimes(1);
    expect(mockAddCustomMetric).toHaveBeenCalledWith({
      sessionId: 'session-1',
      timestamp: expect.any(String),
      category: 'navigation',
      routeName: '/test',
      name: 'tti',
      value: 0.3,
      params: { routeParams: { x: '1' } },
    });
  });

  it('calls AppMetrics.markInteractive when the screen is focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    const arg = { params: { x: 'payload' } };
    await act(async () => {
      await result.current!({ ...arg });
    });
    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({ ...arg, routeName: '/test' });
  });

  it('does not call AppMetrics.markInteractive when the screen is not focused, but still computes TTI', async () => {
    mockUseNavigation.mockReturnValue({ isFocused: () => false });
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
    expect(mockAddCustomMetric).toHaveBeenCalledWith({
      sessionId: 'session-1',
      timestamp: expect.any(String),
      category: 'navigation',
      routeName: '/test',
      name: 'tti',
      value: 0.3,
      params: { routeParams: { x: '1' } },
    });
  });

  it('skips TTI calculation silently when no dispatchTime is recorded for the screen', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const { result } = renderHook(() => useObserveForRouter(), { wrapper: wrapper(storage) });
    await act(async () => {
      await result.current!();
    });
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
