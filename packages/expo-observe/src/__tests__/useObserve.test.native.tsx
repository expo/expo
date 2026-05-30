/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';

import * as routerIntegration from '../integrations/expo-router';
import * as reactNavigationIntegration from '../integrations/react-navigation';
import { useObserve } from '../useObserve';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
    getMainSessionId: jest.fn(() => 'session-1'),
    addCustomMetricToSession: jest.fn(),
  },
}));

jest.mock('../integrations/expo-router', () => ({
  __esModule: true,
  useObserveForRouter: jest.fn(),
  isExpoRouterInitialized: jest.fn(() => true),
}));

jest.mock('../integrations/react-navigation', () => ({
  __esModule: true,
  useObserveForReactNavigation: jest.fn(),
  isReactNavigationInitialized: jest.fn(() => true),
}));

const mockUseObserveForRouter = routerIntegration.useObserveForRouter as jest.Mock;
const isExpoRouterInitializedMock = routerIntegration.isExpoRouterInitialized as jest.Mock;
const mockUseObserveForReactNavigation =
  reactNavigationIntegration.useObserveForReactNavigation as jest.Mock;
const isReactNavigationInitializedMock =
  reactNavigationIntegration.isReactNavigationInitialized as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  isExpoRouterInitializedMock.mockReturnValue(true);
  isReactNavigationInitializedMock.mockReturnValue(true);
  mockUseObserveForReactNavigation.mockReturnValue(null);
});

describe(useObserve, () => {
  it('returns the router-scoped markInteractive when useObserveForRouter resolves to a function', () => {
    const routerScoped = jest.fn();
    mockUseObserveForRouter.mockReturnValue(routerScoped);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(routerScoped);
  });

  it('returns the react-navigation-scoped markInteractive when only that integration is active', () => {
    mockUseObserveForRouter.mockReturnValue(null);
    const reactNavigationScoped = jest.fn();
    mockUseObserveForReactNavigation.mockReturnValue(reactNavigationScoped);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(reactNavigationScoped);
  });

  it('prefers router over react-navigation when both happen to resolve', () => {
    const routerScoped = jest.fn();
    const reactNavigationScoped = jest.fn();
    mockUseObserveForRouter.mockReturnValue(routerScoped);
    mockUseObserveForReactNavigation.mockReturnValue(reactNavigationScoped);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(routerScoped);
  });

  it('falls back to AppMetrics.markInteractive when neither integration is active', () => {
    mockUseObserveForRouter.mockReturnValue(null);
    mockUseObserveForReactNavigation.mockReturnValue(null);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(AppMetrics.markInteractive);
  });

  it('falls back to react-navigation when router is not initialized', () => {
    isExpoRouterInitializedMock.mockReturnValue(false);
    const f = () => {};
    mockUseObserveForReactNavigation.mockReturnValue(f);

    const { result } = renderHook(() => useObserve());

    expect(mockUseObserveForRouter).not.toHaveBeenCalled();
    expect(mockUseObserveForReactNavigation).toHaveBeenCalledTimes(1);
    expect(result.current.markInteractive).toBe(f);
  });

  it('falls back to AppMetrics.markInteractive when react-navigation and expo router are not initialized', () => {
    isExpoRouterInitializedMock.mockReturnValue(false);
    isReactNavigationInitializedMock.mockReturnValue(false);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(AppMetrics.markInteractive);
    expect(mockUseObserveForReactNavigation).not.toHaveBeenCalled();
    expect(mockUseObserveForRouter).not.toHaveBeenCalled();
  });

  it('returns an object with exactly one own key (markInteractive)', () => {
    mockUseObserveForRouter.mockReturnValue(null);
    const { result } = renderHook(() => useObserve());
    expect(Object.keys(result.current)).toEqual(['markInteractive']);
  });
});
