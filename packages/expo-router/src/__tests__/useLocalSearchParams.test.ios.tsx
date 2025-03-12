import React from 'react';
import { View, Text } from 'react-native';
import { expectType } from 'tsd';

import { Slot } from '../exports';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { screen, renderRouter, act } from '../testing-library';
import { renderHook, renderHookOnce } from '../testing-library/private';

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
  const results1: object[] = [];
  const results2: object[] = [];

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
  expectType<Record<string, string | string[] | undefined>>(params);
  expectType<string | string[] | undefined>(params.a);
});
it(`allows abstract types`, () => {
  const params = renderHookOnce(() => useLocalSearchParams<{ a: string }>());
  expectType<{ a?: string }>(params);
  expectType<string | undefined>(params.a);
});

it('should update correctly within layout files', () => {
  renderRouter(
    {
      '(group)/[id]/_layout': function Layout() {
        return (
          <View>
            <Text testID="layout">{useLocalSearchParams().id}</Text>
            <Stack />
          </View>
        );
      },
      '(group)/[id]/index': function Layout() {
        return <Text testID="index">Index</Text>;
      },
    },
    {
      initialUrl: '/1',
    }
  );

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('layout')).toHaveTextContent('1');

  act(() => router.push('/2'));

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('layout')).toHaveTextContent('2');
});
