import { act } from '@testing-library/react-native';
import React from 'react';

import { router, Slot } from '../../exports';
import { renderRouter } from '../../testing-library';
import { useSearchParams } from '../useSearchParams';
import { renderHook } from './renderHook';

describe(useSearchParams, () => {
  it(`return params of deeply nested routes`, () => {
    const { result } = renderHook(() => useSearchParams(), ['[fruit]/[shape]/[...veg?]'], {
      initialUrl: '/apple/square',
    });

    expect([...result.current.entries()]).toEqual([
      ['fruit', 'apple'],
      ['shape', 'square'],
    ]);

    act(() => router.push('/banana/circle/carrot'));

    expect([...result.current.entries()]).toEqual([
      ['fruit', 'banana'],
      ['shape', 'circle'],
      ['veg', 'carrot'],
    ]);
  });

  it(`has a getAll function`, () => {
    const { result } = renderHook(() => useSearchParams(), ['index'], {
      initialUrl: '/?test=1&test=2',
    });

    expect([...result.current.entries()]).toEqual([
      ['test', '1'],
      ['test', '2'],
    ]);
    expect(result.current.getAll('test')).toEqual(['1', '2']);
  });

  it(`cannot set params`, () => {
    const { result } = renderHook(() => useSearchParams(), ['index'], {
      initialUrl: '/?test=1&test=2',
    });

    expect(() => result.current.set('test', '3')).toThrow();
  });

  it('is local by default', () => {
    const results1: [string, string][] = [];
    const results2: [string, string][] = [];

    renderRouter(
      {
        index: () => null,
        '[id]/_layout': () => <Slot />,
        '[id]/index': function Protected() {
          results1.push(...useSearchParams().entries());
          return null;
        },
        '[id]/[fruit]/_layout': () => <Slot />,
        '[id]/[fruit]/index': function Protected() {
          results2.push(...useSearchParams().entries());
          return null;
        },
      },
      {
        initialUrl: '/1',
      }
    );

    expect(results1).toEqual([['id', '1']]);
    act(() => router.push('/2'));
    expect(results1).toEqual([
      ['id', '1'],
      ['id', '2'],
    ]);

    act(() => router.push('/3/apple'));
    // The first screen has not rerendered
    expect(results1).toEqual([
      ['id', '1'],
      ['id', '2'],
    ]);
    expect(results2).toEqual([
      ['id', '3'],
      ['fruit', 'apple'],
    ]);
  });

  it('cannot change between local and global between renders', () => {
    const warn = console.warn;
    console.warn = jest.fn();
    const error = console.error;
    console.error = jest.fn();

    renderRouter(
      {
        '[global]': function Index() {
          const [global, setGlobal] = React.useState(true);

          if (global) {
            setGlobal(false);
          }

          useSearchParams({ global });
          return null;
        },
      },
      {
        initialUrl: '/true',
      }
    );

    expect(console.warn).toHaveBeenCalledWith(
      "Detected change in 'global' option of useSearchParams. This value cannot change between renders"
    );

    console.error = error;
    console.warn = warn;
  });
});
