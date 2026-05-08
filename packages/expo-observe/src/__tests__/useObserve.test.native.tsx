/* eslint-disable @typescript-eslint/no-require-imports */
import { renderHook } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';

import * as routerIntegration from '../integrations/expo-router';
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
}));

const mockUseObserveForRouter = routerIntegration.useObserveForRouter as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useObserve', () => {
  it('returns the router-scoped markInteractive when useObserveForRouter resolves to a function', () => {
    const routerScoped = jest.fn();
    mockUseObserveForRouter.mockReturnValue(routerScoped);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(routerScoped);
  });

  it('falls back to AppMetrics.markInteractive when useObserveForRouter returns null', () => {
    mockUseObserveForRouter.mockReturnValue(null);

    const { result } = renderHook(() => useObserve());

    expect(result.current.markInteractive).toBe(AppMetrics.markInteractive);
  });

  it('calls useObserveForRouter unconditionally on every render', () => {
    mockUseObserveForRouter.mockReturnValue(null);

    const { rerender } = renderHook(() => useObserve());
    expect(mockUseObserveForRouter).toHaveBeenCalledTimes(1);

    rerender(undefined);
    expect(mockUseObserveForRouter).toHaveBeenCalledTimes(2);
  });

  it('returns an object with exactly one own key (markInteractive)', () => {
    mockUseObserveForRouter.mockReturnValue(null);
    const { result } = renderHook(() => useObserve());
    expect(Object.keys(result.current)).toEqual(['markInteractive']);
  });
});
