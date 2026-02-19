import { renderHook } from '@testing-library/react-native';
import React from 'react';

import { CompositionContext, useCompositionOption } from '../CompositionOptionsContext';
import type { CompositionContextValue } from '../types';

jest.mock('../../../../views/useSafeLayoutEffect', () => ({
  useSafeLayoutEffect: require('react').useLayoutEffect,
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual(
    '@react-navigation/native'
  ) as typeof import('@react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({ key: 'test-route', name: 'test' }),
  };
});

function createMockContext(): CompositionContextValue {
  return {
    setOptionsFor: jest.fn(),
    unregister: jest.fn(),
  };
}

function createWrapper(contextValue: CompositionContextValue | null) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(CompositionContext.Provider, { value: contextValue }, children);
  };
}

describe('useCompositionOption', () => {
  it('throws when used outside CompositionContext', () => {
    // Suppress console.error from React for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCompositionOption(() => ({ title: 'Test' }), []));
    }).toThrow(
      'useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.'
    );

    spy.mockRestore();
  });

  it('registers options on mount', () => {
    const context = createMockContext();

    renderHook(() => useCompositionOption(() => ({ title: 'Hello' }), []), {
      wrapper: createWrapper(context),
    });

    expect(context.setOptionsFor).toHaveBeenCalledTimes(1);
    expect(context.setOptionsFor).toHaveBeenCalledWith('test-route', expect.any(String), {
      title: 'Hello',
    });
  });

  it('unregisters on unmount', () => {
    const context = createMockContext();

    const { unmount } = renderHook(() => useCompositionOption(() => ({ title: 'Hello' }), []), {
      wrapper: createWrapper(context),
    });

    expect(context.unregister).not.toHaveBeenCalled();

    unmount();

    expect(context.unregister).toHaveBeenCalledTimes(1);
    expect(context.unregister).toHaveBeenCalledWith('test-route', expect.any(String));
  });

  it('skips re-assigning when dependencies are stable', () => {
    const context = createMockContext();

    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useCompositionOption(() => ({ title, headerShown: true }), [title]),
      {
        wrapper: createWrapper(context),
        initialProps: { title: 'Same' },
      }
    );

    expect(context.setOptionsFor).toHaveBeenCalledTimes(1);

    // Re-render with the same dependency value
    rerender({ title: 'Same' });

    // Should not call setOptionsFor again
    expect(context.setOptionsFor).toHaveBeenCalledTimes(1);
  });

  it('re-assigns when dependencies change', () => {
    const context = createMockContext();

    const { rerender } = renderHook(
      ({ title }: { title: string }) => useCompositionOption(() => ({ title }), [title]),
      {
        wrapper: createWrapper(context),
        initialProps: { title: 'First' },
      }
    );

    expect(context.setOptionsFor).toHaveBeenCalledTimes(1);
    expect(context.setOptionsFor).toHaveBeenCalledWith('test-route', expect.any(String), {
      title: 'First',
    });

    rerender({ title: 'Second' });

    expect(context.setOptionsFor).toHaveBeenCalledTimes(2);
    expect(context.setOptionsFor).toHaveBeenLastCalledWith('test-route', expect.any(String), {
      title: 'Second',
    });
  });
});
