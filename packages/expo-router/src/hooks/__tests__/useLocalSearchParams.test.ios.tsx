import { act } from '@testing-library/react-native';
import { expectTypeOf } from 'expect-type';

import { router, Slot } from '../../exports';
import Stack from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';
import type { UnknownOutputParams } from '../../types';
import { useLocalSearchParams } from '../useLocalSearchParams';
import { renderHook, renderHookOnce } from './renderHook';

interface SearchParamsWithOmittedId extends UnknownOutputParams {
  id?: string;
}

describe(useLocalSearchParams, () => {
  it.each(['initial URL', 'replace'])(
    'reads child query params in layouts on %s',
    async (method) => {
      let layoutParams: UnknownOutputParams = {};
      let leafParams: UnknownOutputParams = {};
      const href = '/play/flag/150?onboarding=1&tag=a&tag=b';

      await renderRouter(
        {
          index: () => null,
          'play/flag/[region]/_layout': function Layout() {
            layoutParams = useLocalSearchParams();
            return <Slot />;
          },
          'play/flag/[region]/index': function Index() {
            leafParams = useLocalSearchParams();
            return null;
          },
        },
        { initialUrl: method === 'initial URL' ? href : '/' }
      );

      if (method === 'replace') {
        await act(() => router.replace(href));
      }

      expect(layoutParams).toEqual({ region: '150', onboarding: '1', tag: ['a', 'b'] });
      expect(layoutParams).toEqual(leafParams);

      await act(() => router.setParams({ onboarding: '%252F', tag: undefined }));
      expect(layoutParams).toEqual({ region: '150', onboarding: '%2F' });
      expect(layoutParams).toEqual(leafParams);

      await act(() => router.replace('/play/flag/150'));
      expect(layoutParams).toEqual({ region: '150' });
    }
  );

  it('keeps child query params local to retained and preloaded layouts', async () => {
    const paramsByRegion = new Map<string | string[] | undefined, UnknownOutputParams>();

    await renderRouter(
      {
        _layout: () => <Stack />,
        '[region]/_layout': function Layout() {
          const params = useLocalSearchParams();
          paramsByRegion.set(params.region, params);
          return <Slot />;
        },
        '[region]/index': () => null,
      },
      { initialUrl: '/150?onboarding=1' }
    );

    await act(() => router.prefetch('/200?onboarding=2'));
    expect(paramsByRegion.get('150')).toEqual({ region: '150', onboarding: '1' });
    expect(paramsByRegion.get('200')).toEqual({ region: '200', onboarding: '2' });

    await act(() => router.push('/200?onboarding=2'));
    await act(() => router.setParams({ onboarding: '3' }));
    expect(paramsByRegion.get('150')).toEqual({ region: '150', onboarding: '1' });
    expect(paramsByRegion.get('200')).toEqual({ region: '200', onboarding: '3' });

    await act(() => router.back());
    expect(paramsByRegion.get('150')).toEqual({ region: '150', onboarding: '1' });
  });

  it(`return styles of deeply nested routes`, async () => {
    const { result } = await renderHook(
      () => useLocalSearchParams(),
      ['[fruit]/[shape]/[...veg?]'],
      {
        initialUrl: '/apple/square',
      }
    );

    expect(result.current).toEqual({
      fruit: 'apple',
      shape: 'square',
    });

    await act(() => router.push('/banana/circle/carrot'));

    expect(result.current).toEqual({
      fruit: 'banana',
      shape: 'circle',
      veg: ['carrot'],
    });
  });

  it('passes values down navigators', async () => {
    const results1: [] = [];
    const results2: [] = [];

    await renderRouter(
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
    await act(() => router.push('/2'));
    expect(results1).toEqual([{ id: '1' }, { id: '2' }]);

    await act(() => router.push('/3/apple'));
    // The first screen has not rerendered
    expect(results1).toEqual([{ id: '1' }, { id: '2' }]);
    expect(results2).toEqual([{ id: '3', fruit: 'apple' }]);
  });

  it(`defaults abstract types`, async () => {
    const params = await renderHookOnce(() => useLocalSearchParams());
    expectTypeOf(params).toExtend<Record<string, string | string[] | undefined>>();
    expectTypeOf(params.a).toEqualTypeOf<string | string[] | undefined>();
  });
  it(`allows abstract types`, async () => {
    const params = await renderHookOnce(() => useLocalSearchParams<{ a: string }>());
    expectTypeOf(params).toExtend<{ a?: string }>();
    expectTypeOf(params.a).toExtend<string | undefined>();
  });
  it(`allows an interface extending UnknownOutputParams to declare an optional param`, async () => {
    const params = await renderHookOnce(() => useLocalSearchParams<SearchParamsWithOmittedId>());
    expectTypeOf(params).toExtend<{ id?: string }>();
    expectTypeOf(params.id).toEqualTypeOf<string | undefined>();
  });

  it('does not return undefined search params', async () => {
    const { result } = await renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=1&test=2',
    });

    expect(result.current).toEqual({
      test: ['1', '2'],
    });

    await act(() => router.setParams({ test: undefined }));

    expect(result.current).toEqual({});
  });

  it('passes null search params through without stringifying them', async () => {
    const { result } = await renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=1',
    });

    expect(result.current).toEqual({
      test: '1',
    });

    await act(() => router.setParams({ test: null }));

    expect(result.current).toEqual({ test: null });
  });

  it(`handles encoded params`, async () => {
    const { result } = await renderHook(() => useLocalSearchParams(), ['index'], {
      initialUrl: '/?test=%2Fhello%2Fworld%2F',
    });

    expect(result.current).toEqual({
      test: '/hello/world/',
    });

    await act(() => router.setParams({ test: '%2Fhello%2Fworld%2Fagain' }));

    expect(result.current).toEqual({
      test: '/hello/world/again',
    });

    await act(() =>
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
