import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';

import { router, Slot } from '../../exports';
import { renderRouter } from '../../testing-library';
import { useLocalSearchParams } from '../useLocalSearchParams';
import { renderHook, renderHookOnce } from './renderHook';

describe(useLocalSearchParams, () => {
  it(`return styles of deeply nested routes`, () => {
    const { result } = renderHook(() => useLocalSearchParams(), ['[fruit]/[shape]/[...veg?]'], {
      initialUrl: '/apple/square',
    });

    expect(result.current).toEqual({
      fruit: 'apple',
      shape: 'square',
    });

    act(() => router.push('/banana/circle/carrot'));

    expect(result.current).toEqual({
      fruit: 'banana',
      shape: 'circle',
      veg: ['carrot'],
    });
  });

  it('passes values down navigators', () => {
    const results1: [] = [];
    const results2: [] = [];

    renderRouter(
      {
        index: () => null,
        '[id]/_layout': () => <Slot />,
        '[id]/index': function Protected() {
          results1.push(useLocalSearchParams());
          return null;
        },
        '[id]/[fruit]/_layout': () => <Slot />,
        '[id]/[fruit]/index': function Protected() {
          results2.push(useLocalSearchParams());
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

  it(`defaults abstract types`, () => {
    const params = renderHookOnce(() => useLocalSearchParams());
    expectTypeOf(params).toExtend<Record<string, string | string[] | undefined>>();
    expectTypeOf(params.a).toEqualTypeOf<string | string[] | undefined>();
  });
  it(`allows abstract types`, () => {
    const params = renderHookOnce(() => useLocalSearchParams<{ a: string }>());
    expectTypeOf(params).toExtend<{ a?: string }>();
    expectTypeOf(params.a).toExtend<string | undefined>();
  });

  it('does not return undefined search params', () => {
    const { result } = renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=1&test=2',
    });

    expect(result.current).toEqual({
      test: ['1', '2'],
    });

    act(() => router.setParams({ test: undefined }));

    expect(result.current).toEqual({});
  });

  it('passes null search params through without stringifying them', () => {
    const { result } = renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=1',
    });

    expect(result.current).toEqual({
      test: '1',
    });

    act(() => router.setParams({ test: null }));

    expect(result.current).toEqual({ test: null });
  });

  it(`handles encoded params`, () => {
    const { result } = renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=%2Fhello%2Fworld%2F',
    });

    // URLSearchParams auto-decodes %2F → / (single decode, correct)
    expect(result.current).toEqual({
      test: '/hello/world/',
    });

    // setParams sets literal values — no encoding/decoding cycle
    act(() => router.setParams({ test: '/hello/world/again' }));

    expect(result.current).toEqual({
      test: '/hello/world/again',
    });

    // router.push encodes via encodeURIComponent, then URLSearchParams decodes once.
    // The round-trip should preserve the original value exactly.
    act(() =>
      router.push({
        pathname: '/',
        params: {
          test: '/foo/bar/',
        },
      })
    );

    expect(result.current).toEqual({
      test: '/foo/bar/',
    });
  });

  it(`preserves percent-encoded characters without double-decoding`, () => {
    // This is the fix for https://github.com/expo/expo/issues/48421
    // Values containing %2F, %2B etc. should survive the round-trip intact.
    act(() =>
      router.push({
        pathname: '/',
        params: {
          url: 'https://s3.amazonaws.com/bucket?token=abc%2Fdef%2Bghi',
        },
      })
    );

    const { result } = renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/',
    });

    // The value should be exactly what was passed in
    act(() =>
      router.push({
        pathname: '/',
        params: {
          url: 'https://s3.amazonaws.com/bucket?token=abc%2Fdef%2Bghi',
        },
      })
    );

    expect(result.current.url).toEqual(
      'https://s3.amazonaws.com/bucket?token=abc%2Fdef%2Bghi'
    );
  });
});
