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
    set: jest.fn(),
    unset: jest.fn(),
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
      renderHook(() => useCompositionOption({ title: 'Test' }));
    }).toThrow(
      'useCompositionOption must be used within a RouterCompositionOptionsProvider. This is likely a bug in Expo Router.'
    );

    spy.mockRestore();
  });

  it('registers options on mount', () => {
    const context = createMockContext();
    const options = { title: 'Hello' };

    renderHook(() => useCompositionOption(options), {
      wrapper: createWrapper(context),
    });

    expect(context.set).toHaveBeenCalledTimes(1);
    expect(context.set).toHaveBeenCalledWith('test-route', options);
  });

  it('unregisters on unmount', () => {
    const context = createMockContext();
    const options = { title: 'Hello' };

    const { unmount } = renderHook(() => useCompositionOption(options), {
      wrapper: createWrapper(context),
    });

    expect(context.unset).not.toHaveBeenCalled();

    unmount();

    expect(context.unset).toHaveBeenCalledTimes(1);
    expect(context.unset).toHaveBeenCalledWith('test-route', options);
  });

  it('skips re-assigning when options reference is stable', () => {
    const context = createMockContext();
    const stableOptions = { title: 'Same', headerShown: true as const };

    const { rerender } = renderHook(() => useCompositionOption(stableOptions), {
      wrapper: createWrapper(context),
    });

    expect(context.set).toHaveBeenCalledTimes(1);

    // Re-render with the same options reference
    rerender({});

    // Should not call set again
    expect(context.set).toHaveBeenCalledTimes(1);
  });

  it('re-assigns when options reference changes', () => {
    const context = createMockContext();

    const { rerender } = renderHook(
      ({ title }: { title: string }) => useCompositionOption({ title }),
      {
        wrapper: createWrapper(context),
        initialProps: { title: 'First' },
      }
    );

    expect(context.set).toHaveBeenCalledTimes(1);
    expect(context.set).toHaveBeenCalledWith('test-route', { title: 'First' });

    rerender({ title: 'Second' });

    // Old options should be cleaned up before new ones are set
    expect(context.unset).toHaveBeenCalledTimes(1);
    expect(context.unset).toHaveBeenCalledWith('test-route', { title: 'First' });

    expect(context.set).toHaveBeenCalledTimes(2);
    expect(context.set).toHaveBeenLastCalledWith('test-route', { title: 'Second' });
  });
});
