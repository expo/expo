import { screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/StackClient';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

it('returns to the existing navigator when a deep link targets a screen inside it', async () => {
  let listener: (url: string) => void = () => {};

  const result = await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="index" />,
    '(tabs)/second': () => <Text testID="second" />,
    sheet: () => <Text testID="sheet" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  await act(() => router.push('/sheet'));
  await act(() => listener('/second'));

  expect(screen).toHavePathname('/second');
  const rootStack = result.getRouterState()?.routes[0]?.state;
  expect(rootStack?.routes.map((route) => route.name)).toEqual(['(tabs)']);
});

it('returns to an existing navigator nested inside the one the deep link returns to', async () => {
  let listener: (url: string) => void = () => {};

  const result = await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="feed" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="index" />,
    '(tabs)/feed/_layout': () => <Stack />,
    '(tabs)/feed/index': () => <Text testID="feed" />,
    '(tabs)/feed/details': () => <Text testID="details" />,
    '(tabs)/feed/inner/_layout': () => <Stack />,
    '(tabs)/feed/inner/index': () => <Text testID="inner" />,
    sheet: () => <Text testID="sheet" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  await act(() => router.push('/feed/inner'));
  await act(() => router.push('/feed/details'));
  await act(() => router.push('/sheet'));
  await act(() => listener('/feed/inner'));

  expect(screen).toHavePathname('/feed/inner');
  const rootStack = result.getRouterState()?.routes[0]?.state;
  expect(rootStack?.routes.map((route) => route.name)).toEqual(['(tabs)']);
  const feedStack = rootStack?.routes[0]?.state?.routes.find(
    (route) => route.name === 'feed'
  )?.state;
  expect(feedStack?.routes.map((route) => route.name)).toEqual(['inner']);
});

it('returns to a navigator that has no index screen', async () => {
  let listener: (url: string) => void = () => {};

  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    'settings/_layout': () => <Stack />,
    'settings/profile': () => <Text testID="profile" />,
    sheet: () => <Text testID="sheet" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  await act(() => router.push('/settings/profile'));
  await act(() => router.push('/sheet'));
  await act(() => listener('/settings'));

  const rootStack = result.getRouterState()?.routes[0]?.state;
  expect(rootStack?.routes.map((route) => route.name)).toEqual(['index', 'settings']);
});

it('returns to a screen already in a nested stack', async () => {
  let listener: (url: string) => void = () => {};

  const result = await renderRouter({
    _layout: () => <Stack />,
    '(tabs)/_layout': () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="feed" />
      </Tabs>
    ),
    '(tabs)/index': () => <Text testID="index" />,
    '(tabs)/feed/_layout': () => <Stack />,
    '(tabs)/feed/index': () => <Text testID="feed" />,
    '(tabs)/feed/details': () => <Text testID="details" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  await act(() => router.push('/feed'));
  await act(() => router.push('/feed/details'));
  await act(() => listener('/feed'));

  expect(screen).toHavePathname('/feed');
  const feedStack = result
    .getRouterState()
    ?.routes[0]?.state?.routes[0]?.state?.routes.find((route) => route.name === 'feed')?.state;
  expect(feedStack?.routes.map((route) => route.name)).toEqual(['index']);
});

it('still pushes a screen of the root stack that holds no navigator', async () => {
  let listener: (url: string) => void = () => {};

  const result = await renderRouter({
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
    details: () => <Text testID="details" />,
    sheet: () => <Text testID="sheet" />,
    '+native-intent': {
      legacy_subscribe(listenerFn) {
        listener = listenerFn;
        return () => {};
      },
    },
  });

  await act(() => router.push('/details'));
  await act(() => router.push('/sheet'));
  await act(() => listener('/details'));

  const rootStack = result.getRouterState()?.routes[0]?.state;
  expect(rootStack?.routes.map((route) => route.name)).toEqual([
    'index',
    'details',
    'sheet',
    'details',
  ]);
});

describe('a navigator with a dynamic name', () => {
  async function renderUsers() {
    let listener: (url: string) => void = () => {};
    const result = await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index" />,
      'users/[id]/_layout': () => <Stack />,
      'users/[id]/index': () => <Text testID="user" />,
      sheet: () => <Text testID="sheet" />,
      '+native-intent': {
        legacy_subscribe(listenerFn) {
          listener = listenerFn;
          return () => {};
        },
      },
    });
    await act(() => router.push('/users/1'));
    await act(() => router.push('/sheet'));
    const rootRoutes = () =>
      result
        .getRouterState()
        ?.routes[0]?.state?.routes.map((route) =>
          route.name === 'users/[id]'
            ? `users/${(route.params as { id?: string })?.id}`
            : route.name
        );
    return { link: (url: string) => act(() => listener(url)), rootRoutes };
  }

  it('returns to the instance with the same params', async () => {
    const { link, rootRoutes } = await renderUsers();
    await link('/users/1');
    expect(rootRoutes()).toEqual(['index', 'users/1']);
  });

  it('pushes a new instance for different params instead of taking over another one', async () => {
    const { link, rootRoutes } = await renderUsers();
    await link('/users/2');
    expect(rootRoutes()).toEqual(['index', 'users/1', 'sheet', 'users/2']);
  });
});
