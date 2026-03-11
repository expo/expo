import { renderHook, act } from '@testing-library/react-native';

import { useZoomPrefetchNavigation } from '../useZoomPrefetchNavigation';

const mockPrefetch = jest.fn();
const mockIsFocused = jest.fn(() => true);

jest.mock('../../../hooks', () => ({
  useRouter: () => ({ prefetch: mockPrefetch }),
}));

jest.mock('../../../useNavigation', () => ({
  useNavigation: () => ({ isFocused: mockIsFocused }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockIsFocused.mockReturnValue(true);
});

describe('useZoomPrefetchNavigation', () => {
  it('returns a handler returning false when withZoomTransition is false', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: false,
        resolvedHref: '/test',
        navigate,
      })
    );

    const handled = result.current();
    expect(handled).toBe(false);
    expect(mockPrefetch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns a handler returning true when withZoomTransition is true', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/test',
        navigate,
      })
    );

    let handled: boolean;
    act(() => {
      handled = result.current();
    });
    expect(handled!).toBe(true);
  });

  it('returns false and does not prefetch when screen is unfocused', () => {
    mockIsFocused.mockReturnValue(false);
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/test',
        navigate,
      })
    );

    const handled = result.current();
    expect(handled).toBe(false);
    expect(mockPrefetch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns false and does not prefetch when event has defaultPrevented', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/test',
        navigate,
      })
    );

    const event = {
      defaultPrevented: true,
      preventDefault: jest.fn(),
    } as any;

    const handled = result.current(event);
    expect(handled).toBe(false);
    expect(mockPrefetch).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('prefetches synchronously but defers navigate to the next render via useEffect', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/details/42',
        navigate,
      })
    );

    const event = {
      defaultPrevented: false,
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      const handled = result.current(event);
      expect(handled).toBe(true);

      // Prefetch and preventDefault happen synchronously in the handler
      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(mockPrefetch).toHaveBeenCalledWith('/details/42');

      // Navigate must NOT have been called yet — it's deferred to useEffect
      expect(navigate).not.toHaveBeenCalled();
    });

    // After act() flushes the useEffect, navigate should have been called
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('prefetches and navigates when no event is passed', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/page',
        navigate,
      })
    );

    act(() => {
      const handled = result.current();
      expect(handled).toBe(true);
    });

    expect(mockPrefetch).toHaveBeenCalledWith('/page');
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('can trigger multiple press cycles', () => {
    const navigate = jest.fn();
    const { result } = renderHook(() =>
      useZoomPrefetchNavigation({
        withZoomTransition: true,
        resolvedHref: '/test',
        navigate,
      })
    );

    // First press
    act(() => {
      result.current();
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);

    // Second press
    act(() => {
      result.current();
    });

    expect(mockPrefetch).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
