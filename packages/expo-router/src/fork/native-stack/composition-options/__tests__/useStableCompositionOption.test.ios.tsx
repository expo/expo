import { renderHook } from '@testing-library/react-native';
import React from 'react';

import { CompositionContext } from '../CompositionOptionsContext';
import type { CompositionContextValue } from '../types';
import { fingerprintValue, useStableCompositionOption } from '../useStableCompositionOption';

jest.mock('../../../../views/useSafeLayoutEffect', () => ({
  useSafeLayoutEffect: require('react').useLayoutEffect,
}));

jest.mock('../../../../react-navigation/native', () => {
  const actual = jest.requireActual(
    '../../../../react-navigation/native'
  ) as typeof import('../../../../react-navigation/native');
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

describe('fingerprintValue', () => {
  it('produces stable strings for primitives', () => {
    expect(fingerprintValue('hello')).toBe('s:hello');
    expect(fingerprintValue(42)).toBe('n:42');
    expect(fingerprintValue(true)).toBe('b:true');
    expect(fingerprintValue(null)).toBe('null');
    expect(fingerprintValue(undefined)).toBe('undef');
  });

  it('skips functions', () => {
    expect(fingerprintValue(() => 1)).toBe('fn');
    expect(fingerprintValue(function named() {})).toBe('fn');
  });

  it('produces identical strings for two structurally equal style objects', () => {
    const a = { backgroundColor: 'red', fontSize: 14 };
    const b = { backgroundColor: 'red', fontSize: 14 };
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('sorts keys for stable ordering', () => {
    const a = { fontSize: 14, backgroundColor: 'red' };
    const b = { backgroundColor: 'red', fontSize: 14 };
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('detects content changes in style objects', () => {
    const a = { backgroundColor: 'red' };
    const b = { backgroundColor: 'blue' };
    expect(fingerprintValue(a)).not.toBe(fingerprintValue(b));
  });

  it('skips function values inside objects', () => {
    const a = { onPress: () => 1, label: 'A' };
    const b = { onPress: () => 2, label: 'A' };
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('skips undefined values', () => {
    const a = { label: 'A', extra: undefined };
    const b = { label: 'A' };
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('skips React refs (single-current plain objects)', () => {
    const a = { current: { someInternal: 'state' } };
    const b = { current: null };
    expect(fingerprintValue(a)).toBe('ref');
    expect(fingerprintValue(b)).toBe('ref');
  });

  it('walks two-key objects normally (not treated as ref)', () => {
    const a = { current: 'a', label: 'b' };
    expect(fingerprintValue(a)).not.toBe('ref');
  });

  it('recurses into arrays', () => {
    const a = [1, 'two', { three: 3 }];
    const b = [1, 'two', { three: 3 }];
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('detects element-type changes in JSX', () => {
    const a = React.createElement('div', { id: 'x' });
    const b = React.createElement('span', { id: 'x' });
    expect(fingerprintValue(a)).not.toBe(fingerprintValue(b));
  });

  it('detects prop changes in JSX', () => {
    const a = React.createElement('div', { id: 'x' });
    const b = React.createElement('div', { id: 'y' });
    expect(fingerprintValue(a)).not.toBe(fingerprintValue(b));
  });

  it('treats two structurally identical JSX trees as equal', () => {
    const a = React.createElement('div', { id: 'x' }, React.createElement('span', null, 'hi'));
    const b = React.createElement('div', { id: 'x' }, React.createElement('span', null, 'hi'));
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('treats two JSX trees that only differ by handler identity as equal', () => {
    const a = React.createElement('button', { onClick: () => 1, label: 'X' });
    const b = React.createElement('button', { onClick: () => 2, label: 'X' });
    expect(fingerprintValue(a)).toBe(fingerprintValue(b));
  });

  it('detects JSX key changes', () => {
    const a = React.createElement('div', { key: 'a' });
    const b = React.createElement('div', { key: 'b' });
    expect(fingerprintValue(a)).not.toBe(fingerprintValue(b));
  });

  it('truncates at the depth limit instead of recursing forever', () => {
    // Build an 11-level nested object (deeper than MAX_FINGERPRINT_DEPTH=10).
    let nested: any = { leaf: 1 };
    for (let i = 0; i < 11; i++) nested = { inner: nested };
    // Should not throw and should return a string.
    const fp = fingerprintValue(nested);
    expect(typeof fp).toBe('string');
    expect(fp).toContain('~');
  });
});

describe('useStableCompositionOption', () => {
  it('registers options on mount and skips re-registration on unrelated re-render', () => {
    const context = createMockContext();
    const { rerender } = renderHook(
      ({ tick }: { tick: number }) =>
        useStableCompositionOption({ title: 'Hello', tick }, ({ title }) => ({ title })),
      {
        wrapper: createWrapper(context),
        initialProps: { tick: 0 },
      }
    );

    expect(context.set).toHaveBeenCalledTimes(1);
    expect(context.set).toHaveBeenCalledWith('test-route', { title: 'Hello' });

    // Rerender with the same effective input. The build closure produces the
    // same options content, so the helper should NOT redispatch.
    rerender({ tick: 0 });
    expect(context.set).toHaveBeenCalledTimes(1);
  });

  it('does not redispatch when only function-typed props change', () => {
    const context = createMockContext();
    const { rerender } = renderHook(
      // Inline arrow on every render: identity churn that the helper must absorb.
      () =>
        useStableCompositionOption({ title: 'Hello', onPress: () => 1 }, ({ title }) => ({
          title,
        })),
      { wrapper: createWrapper(context) }
    );

    expect(context.set).toHaveBeenCalledTimes(1);

    rerender({});
    rerender({});
    rerender({});

    // Function identity changed three times. The helper must NOT redispatch.
    expect(context.set).toHaveBeenCalledTimes(1);
    expect(context.unset).not.toHaveBeenCalled();
  });

  it('redispatches when serializable props change', () => {
    const context = createMockContext();
    const { rerender } = renderHook(
      ({ title }: { title: string }) =>
        useStableCompositionOption({ title }, (input) => ({ title: input.title })),
      {
        wrapper: createWrapper(context),
        initialProps: { title: 'First' },
      }
    );

    expect(context.set).toHaveBeenCalledTimes(1);

    rerender({ title: 'Second' });

    expect(context.unset).toHaveBeenCalledTimes(1);
    expect(context.set).toHaveBeenCalledTimes(2);
    expect(context.set).toHaveBeenLastCalledWith('test-route', { title: 'Second' });
  });

  it('does not redispatch when an inline style object has identical content', () => {
    const context = createMockContext();
    const { rerender } = renderHook(
      // Inline style literal: new identity every render, same content.
      () =>
        useStableCompositionOption({ style: { backgroundColor: '#fff' } }, (input) => ({
          headerStyle: input.style as any,
        })),
      { wrapper: createWrapper(context) }
    );

    expect(context.set).toHaveBeenCalledTimes(1);

    rerender({});
    rerender({});

    expect(context.set).toHaveBeenCalledTimes(1);
  });
});
