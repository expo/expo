/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook, act } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';

import * as routerModule from '../router';
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
    },
    isRouterInstalled: true,
    __useRoute: useRoute,
    __useNavigation: useNavigation,
  };
});

const mockUseRoute = (routerModule as unknown as { __useRoute: jest.Mock }).__useRoute;
const mockUseNavigation = (routerModule as unknown as { __useNavigation: jest.Mock })
  .__useNavigation;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRoute.mockReturnValue({ key: 'screen-a' });
  mockUseNavigation.mockReturnValue({ isFocused: () => true });
});

describe('useObserveForRouter (android)', () => {
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
});
