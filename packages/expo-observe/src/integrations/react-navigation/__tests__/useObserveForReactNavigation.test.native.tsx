/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook, act } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';
import { type ReactNode } from 'react';

import { ObserveReactNavigationIntegrationContext } from '../context';
import {
  createReactNavigationIntegrationStorage,
  type ReactNavigationIntegrationStorage,
} from '../storage';
import { useObserveForReactNavigation } from '../useObserveForReactNavigation';

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
  initReactNavigationIntegration: jest.fn(),
}));

jest.mock('@react-navigation/native', () => {
  const useRoute = jest.fn(() => ({ key: 'screen-a', name: 'A', params: { x: '1' } }));
  const useNavigation = jest.fn(() => ({ isFocused: () => true }));
  const useStateForPath = jest.fn(() => ({
    index: 0,
    routes: [{ key: 'screen-a', name: 'A', params: { x: '1' } }],
  }));
  return {
    __esModule: true,
    useRoute,
    useNavigation,
    useStateForPath,
    getPathFromState: jest.fn(() => '/from-linking'),
    __useRoute: useRoute,
    __useNavigation: useNavigation,
  };
});

const reactNavigationModule = require('@react-navigation/native') as {
  __useRoute: jest.Mock;
  __useNavigation: jest.Mock;
  useStateForPath: jest.Mock;
};
const mockUseRoute = reactNavigationModule.__useRoute;
const mockUseNavigation = reactNavigationModule.__useNavigation;
const mockUseStateForPath = reactNavigationModule.useStateForPath;
const initModule = require('../init') as { isInitialized: jest.Mock };

const mockAddCustomMetric = AppMetrics.addCustomMetricToSession as jest.Mock;

function wrapper(value: { storage: ReactNavigationIntegrationStorage } | null) {
  const contextValue = value
    ? {
        storage: value.storage,
        getPathname: (state: any) => {
          if (!state) return undefined;
          const route = state.routes?.[state.index ?? 0];
          return route ? `/${route.name}` : undefined;
        },
      }
    : null;
  return ({ children }: { children: ReactNode }) => (
    <ObserveReactNavigationIntegrationContext.Provider value={contextValue}>
      {children}
    </ObserveReactNavigationIntegrationContext.Provider>
  );
}

let storage: ReactNavigationIntegrationStorage;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  initModule.isInitialized.mockReturnValue(true);
  mockUseRoute.mockReturnValue({ key: 'screen-a', name: 'A', params: { x: '1' } });
  mockUseNavigation.mockReturnValue({ isFocused: () => true });
  mockUseStateForPath.mockReturnValue({
    index: 0,
    routes: [{ key: 'screen-a', name: 'A', params: { x: '1' } }],
  });
  storage = createReactNavigationIntegrationStorage();
});

describe('useObserveForReactNavigation', () => {
  it('records TTI from dispatchTime on the first call when focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });

    expect(mockAddCustomMetric).toHaveBeenCalledTimes(1);
    expect(mockAddCustomMetric).toHaveBeenCalledWith({
      sessionId: 'session-1',
      timestamp: expect.any(String),
      category: 'navigation',
      routeName: '/A',
      name: 'tti',
      value: 0.3,
      params: { routeParams: { x: '1' } },
    });
  });

  it('calls AppMetrics.markInteractive when the screen is focused', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!({ params: { x: 'payload' } });
    });
    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({
      params: { x: 'payload' },
      routeName: '/A',
    });
  });

  it('still records lastInteractiveCall when the screen is not focused (skips markInteractive and TTI)', async () => {
    mockUseNavigation.mockReturnValue({ isFocused: () => false });
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).not.toHaveBeenCalled();
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(storage.screenTimes['screen-a'].lastInteractiveCall).toBe(1300);
    expect(storage.interactiveScreensIds.has('screen-a')).toBe(true);
  });

  it('skips TTI silently when no dispatchTime is recorded for the screen', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });
    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns and skips when called on an unmounted screen', async () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const { result, unmount } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
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
    mockUseRoute.mockReturnValue({ key: undefined, name: 'A', params: {} });
    const warnSpy = jest.spyOn(console, 'warn');
    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
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
    mockUseRoute.mockReturnValue({ key: 'screen-a', name: 'A', params: {} });
    const { rerender } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });

    mockUseRoute.mockReturnValue({ key: 'screen-b', name: 'A', params: {} });
    rerender(undefined);

    expect(warnSpy).toHaveBeenCalledWith(
      '[expo-observe] Screen ID changed between renders. The hook should be called inside the screen component, not a higher wrapper.'
    );
  });

  it('throws when isInitialized() flips mid-lifetime', () => {
    initModule.isInitialized.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });

    initModule.isInitialized.mockReturnValue(true);
    expect(() => rerender(undefined)).toThrow(
      "[expo-observe] React Navigation integration was toggled during a screen's lifecycle. Call `Observe.configure({ integrations: { 'react-navigation': true } })` once at startup before any screen mounts."
    );
  });

  it('records interactive only once per navigation (skips duplicate calls)', async () => {
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1300);

    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });
    await act(async () => {
      await result.current!();
    });
    expect(mockAddCustomMetric).toHaveBeenCalledTimes(1);
  });

  it('falls back to route.name when useStateForPath returns undefined', async () => {
    mockUseStateForPath.mockReturnValue(undefined);
    storage.screenTimes['screen-a'] = { dispatchTime: 1000 };
    jest.spyOn(performance, 'now').mockReturnValue(1100);

    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });

    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({ routeName: 'A' });
  });

  it('stores lastInteractiveCall and defers TTI emission when dispatchTime is not yet recorded', async () => {
    // markInteractive runs before handleStateChange has recorded the dispatch.
    jest.spyOn(performance, 'now').mockReturnValue(1234);

    const { result } = renderHook(() => useObserveForReactNavigation(), {
      wrapper: wrapper({ storage }),
    });
    await act(async () => {
      await result.current!();
    });

    expect(mockAddCustomMetric).not.toHaveBeenCalled();
    expect(storage.screenTimes['screen-a']).toEqual({ lastInteractiveCall: 1234 });
    expect(storage.interactiveScreensIds.has('screen-a')).toBe(true);
  });
});
