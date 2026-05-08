import { renderHook } from '@testing-library/react-native';
import AppMetrics from 'expo-app-metrics';

import { useObserve } from '../useObserve';

jest.mock('expo-app-metrics', () => ({
  __esModule: true,
  default: {
    markInteractive: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useObserve', () => {
  it('returns AppMetrics.markInteractive', () => {
    const { result } = renderHook(() => useObserve());
    expect(result.current.markInteractive).toBe(AppMetrics.markInteractive);
  });

  it('forwards calls to AppMetrics.markInteractive', () => {
    const { result } = renderHook(() => useObserve());
    result.current.markInteractive({ foo: 'bar' });
    expect(AppMetrics.markInteractive).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('exposes only markInteractive', () => {
    const { result } = renderHook(() => useObserve());
    expect(Object.keys(result.current)).toEqual(['markInteractive']);
  });
});
