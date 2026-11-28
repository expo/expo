import { Fragment, useState } from 'react';
import { View } from 'react-native';
import type { NavigatorArgs } from 'standard-navigation';

import { router } from '../../imperative-api';
import { Stack } from '../../layouts/Stack';
import Tabs from '../../layouts/Tabs';
import type { ParamListBase } from '../../react-navigation/core';
import {
  TabRouter,
  type TabNavigationState,
  type TabRouterOptions,
} from '../../react-navigation/native';
import { act, renderRouter } from '../../testing-library';
import { createStandardRouterNavigator } from '../index';

type EventMap = Record<string, { data: object | undefined; canPreventDefault: boolean }>;

let contentArgs: NavigatorArgs<object, EventMap> | undefined;
let contentRenders = 0;

function Content(args: NavigatorArgs<object, EventMap>) {
  contentArgs = args;
  contentRenders++;
  return args.state.routes.map((route) => (
    <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
  ));
}

const CustomTabs = createStandardRouterNavigator<
  object,
  TabNavigationState<ParamListBase>,
  EventMap,
  object,
  TabRouterOptions
>(Content, TabRouter);

beforeEach(() => {
  contentArgs = undefined;
  contentRenders = 0;
});

it('does not render the content of a navigator for a navigation that does not change it', async () => {
  await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => <CustomTabs />,
    '(tabs)/index': () => <View />,
    '(tabs)/second': () => <View />,
    details: () => <View />,
  });

  const renders = contentRenders;

  await act(() => router.push('/details'));
  expect(contentRenders).toBe(renders);

  await act(() => router.back());
  expect(contentRenders).toBe(renders);
});

it('keeps the descriptor and the element of a route that a navigation does not change', async () => {
  await renderRouter({
    _layout: () => <CustomTabs />,
    index: () => <View />,
    second: () => <View />,
  });

  const first = contentArgs!.state.routes[0]!;
  const descriptor = contentArgs!.descriptors[first.key]!;
  const element = descriptor.render();

  await act(() => router.navigate('/second'));

  expect(contentArgs!.state.index).toBe(1);
  expect(contentArgs!.descriptors[first.key]).toBe(descriptor);
  expect(contentArgs!.descriptors[first.key]!.render()).toBe(element);
});

it('gives a route a new descriptor when its options change', async () => {
  let setTitle: (title: string) => void = () => {};

  function Layout() {
    const [title, setTitleState] = useState('one');
    setTitle = setTitleState;
    return <CustomTabs screenOptions={{ title }} />;
  }

  await renderRouter({
    _layout: Layout,
    index: () => <View />,
    second: () => <View />,
  });

  const { key } = contentArgs!.state.routes[0]!;
  const descriptor = contentArgs!.descriptors[key]!;
  expect(descriptor.options).toEqual({ title: 'one' });

  await act(() => setTitle('two'));

  expect(contentArgs!.descriptors[key]).not.toBe(descriptor);
  expect(contentArgs!.descriptors[key]!.options).toEqual({ title: 'two' });
});

it('does not render the headers of bottom tabs when a screen is pushed above them', async () => {
  const headerTitle = jest.fn(() => null);

  await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs screenOptions={{ headerTitle }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    '(tabs)/index': () => <View />,
    '(tabs)/second': () => <View />,
    details: () => <View />,
  });

  expect(headerTitle).toHaveBeenCalled();
  headerTitle.mockClear();

  await act(() => router.push('/details'));
  await act(() => router.back());

  expect(headerTitle).not.toHaveBeenCalled();
});
