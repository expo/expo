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
