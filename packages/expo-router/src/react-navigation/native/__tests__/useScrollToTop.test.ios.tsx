import { userEvent } from '@testing-library/react-native';
import { Pressable, View } from 'react-native';

import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import { Tabs } from '../../../layouts/Tabs';
import { act, renderRouter, screen } from '../../../testing-library';
import { useScrollToTop } from '../useScrollToTop';

function createScrollableScreen(scrollTo: jest.Mock) {
  const ref = { current: { scrollTo } };

  return function ScrollableScreen() {
    useScrollToTop(ref);
    return <View />;
  };
}

function flushAnimationFrame() {
  act(() => jest.runAllTimers());
}

test('scrolls a screen directly in the focused tab to the top', async () => {
  const scrollTo = jest.fn();

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: createScrollableScreen(scrollTo),
    second: () => <View />,
  });

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  flushAnimationFrame();

  expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
});

test('does not scroll a screen in an unfocused tab', async () => {
  const scrollTo = jest.fn();

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="second" options={{ lazy: false }} />
      </Tabs>
    ),
    index: () => <View />,
    second: createScrollableScreen(scrollTo),
  });

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  flushAnimationFrame();

  expect(scrollTo).not.toHaveBeenCalled();
});

test('scrolls the first screen of a stack nested in a tab to the top', async () => {
  const scrollTo = jest.fn();

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="one" />
          <Tabs.Screen name="two" />
        </Tabs>
      ),
      'one/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'one/index': createScrollableScreen(scrollTo),
      'one/details': () => <View />,
      two: () => <View />,
    },
    { initialUrl: '/one' }
  );

  await userEvent.press(screen.getByRole('button', { name: 'one, tab, 1 of 2' }));
  flushAnimationFrame();

  expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
});

test('does not scroll a non-first screen of a stack nested in a tab', async () => {
  const scrollTo = jest.fn();

  renderRouter(
    {
      _layout: () => (
        <Tabs>
          <Tabs.Screen name="one" />
          <Tabs.Screen name="two" />
        </Tabs>
      ),
      'one/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'one/index': () => (
        <Pressable
          accessibilityLabel="Details"
          accessibilityRole="button"
          onPress={() => router.push('/one/details')}
        />
      ),
      'one/details': createScrollableScreen(scrollTo),
      two: () => <View />,
    },
    { initialUrl: '/one' }
  );
  await userEvent.press(screen.getByRole('button', { name: 'Details' }));

  await userEvent.press(screen.getByRole('button', { name: 'one, tab, 1 of 2' }));
  flushAnimationFrame();

  expect(scrollTo).not.toHaveBeenCalled();
});

test('does not scroll when another tabPress listener prevents the default action', async () => {
  const scrollTo = jest.fn();

  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" listeners={{ tabPress: (event) => event.preventDefault() }} />
        <Tabs.Screen name="second" />
      </Tabs>
    ),
    index: createScrollableScreen(scrollTo),
    second: () => <View />,
  });

  await userEvent.press(screen.getByRole('button', { name: 'index, tab, 1 of 2' }));
  flushAnimationFrame();

  expect(scrollTo).not.toHaveBeenCalled();
});
