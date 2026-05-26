import { act } from '@testing-library/react-native';
import { expectType } from 'tsd';

import { router, Slot } from '../../exports';
import Stack from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';
import { useGlobalSearchParams } from '../useGlobalSearchParams';
import { useLocalSearchParams } from '../useLocalSearchParams';
import { usePathname } from '../usePathname';
import { renderHook, renderHookOnce } from './renderHook';

describe(useGlobalSearchParams, () => {
  it(`return params of deeply nested routes`, () => {
    const { result } = renderHook(() => useGlobalSearchParams(), ['[fruit]/[shape]/[...veg?]'], {
      initialUrl: '/apple/square',
    });

    expect(result.current).toEqual({
      fruit: 'apple',
      shape: 'square',
    });

    act(() => router.push('/banana/circle/carrot/beetroot'));

    expect(result.current).toEqual({
      fruit: 'banana',
      shape: 'circle',
      veg: ['carrot', 'beetroot'],
    });
  });

  it(`defaults abstract types`, () => {
    const params = renderHookOnce(() => useGlobalSearchParams());
    expectType<Record<string, string | string[] | undefined>>(params);
    expectType<string | string[] | undefined>(params.a);
  });
  it(`allows abstract types`, () => {
    const params = renderHookOnce(() => useGlobalSearchParams<{ a: string }>());
    expectType<{ a?: string }>(params);
    expectType<string | undefined>(params.a);
  });

  it(`only renders once per navigation`, () => {
    const allHookValues: unknown[] = [];

    renderRouter(
      {
        '[fruit]/[shape]/[...veg?]': function Test() {
          allHookValues.push({
            url: usePathname(),
            globalParams: useGlobalSearchParams(),
            params: useLocalSearchParams(),
          });
          return null;
        },
      },
      {
        initialUrl: '/apple/square',
      }
    );

    act(() => router.push('/banana/circle/carrot/beetroot'));

    expect(allHookValues).toEqual([
      // The initial render
      {
        url: '/apple/square',
        globalParams: {
          fruit: 'apple',
          shape: 'square',
        },
        params: {
          fruit: 'apple',
          shape: 'square',
        },
      },
      // The new screen
      {
        url: '/banana/circle/carrot/beetroot',
        globalParams: {
          fruit: 'banana',
          shape: 'circle',
          veg: ['carrot', 'beetroot'],
        },
        params: {
          fruit: 'banana',
          shape: 'circle',
          veg: ['carrot', 'beetroot'],
        },
      },
    ]);
  });

  it(`causes stacks in a screen to rerender on change `, () => {
    const allHookValues: unknown[] = [];

    // When using a navigation that keeps the screens in memory (e.g. Stack)
    // , any <Screen /> that uses useGlobalSearchParams Should update
    // when the searchparams change, even if not visible
    //
    // This is different to the "only renders once per navigation" which only renders
    // the current screen

    renderRouter(
      {
        _layout: () => <Stack />,
        '[fruit]/[shape]/[...veg?]': function Test() {
          allHookValues.push({
            url: usePathname(),
            globalParams: useGlobalSearchParams(),
            params: useLocalSearchParams(),
          });
          return null;
        },
      },
      {
        initialUrl: '/apple/square',
      }
    );

    act(() => router.push('/banana/circle/carrot'));

    expect(allHookValues).toEqual([
      // The initial render
      {
        url: '/apple/square',
        globalParams: {
          fruit: 'apple',
          shape: 'square',
        },
        params: {
          fruit: 'apple',
          shape: 'square',
        },
      },
      // The new screen
      {
        url: '/banana/circle/carrot',
        globalParams: {
          fruit: 'banana',
          shape: 'circle',
          veg: ['carrot'],
        },
        params: {
          fruit: 'banana',
          shape: 'circle',
          veg: ['carrot'],
        },
      },
      // The is the first page rerendering due to being in a <Stack />
      {
        url: '/banana/circle/carrot',
        globalParams: {
          fruit: 'banana',
          shape: 'circle',
          veg: ['carrot'],
        },
        params: {
          fruit: 'apple',
          shape: 'square',
        },
      },
    ]);
  });

  it('preserves the params ', () => {
    const results1: [] = [];
    const results2: [] = [];

    renderRouter(
      {
        index: () => null,
        '[id]/_layout': () => <Slot />,
        '[id]/index': function Protected() {
          results1.push(useGlobalSearchParams());
          return null;
        },
        '[id]/[fruit]/_layout': () => <Slot />,
        '[id]/[fruit]/index': function Protected() {
          results2.push(useGlobalSearchParams());
          return null;
        },
      },
      {
        initialUrl: '/1',
      }
    );

    expect(results1).toEqual([{ id: '1' }]);
    act(() => router.push('/2'));
    expect(results1).toEqual([{ id: '1' }, { id: '2' }]);

    act(() => router.push('/3/apple'));
    // The first screen has not rerendered
    expect(results1).toEqual([{ id: '1' }, { id: '2' }]);
    expect(results2).toEqual([{ id: '3', fruit: 'apple' }]);
  });

  it(`handles encoded params`, () => {
    const { result } = renderHook(() => useGlobalSearchParams(), ['index'], {
      initialUrl: '/?test=%2Fhello%2Fworld%2F',
    });

    expect(result.current).toEqual({
      test: '/hello/world/',
    });

    act(() => router.setParams({ test: '%2Fhello%2Fworld%2Fagain' }));

    expect(result.current).toEqual({
      test: '/hello/world/again',
    });

    act(() =>
      router.push({
        pathname: '/',
        params: {
          test: '%2Ffoo%2Fbar%2F',
        },
      })
    );

    expect(result.current).toEqual({
      test: '/foo/bar/',
    });
  });
});
