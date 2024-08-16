import React from 'react';
import { Text } from 'react-native';

import { TabList, TabSlot, TabTrigger, Tabs } from '../headless';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { RenderRouterOptions, act, fireEvent, renderRouter, screen } from '../testing-library';

const render = (options: RenderRouterOptions = {}) =>
  renderRouter(
    {
      '(group)/_layout': {
        unstable_settings: {
          initialRouteName: 'orange',
        },
        default: () => {
          return (
            <Tabs>
              <TabList>
                <TabTrigger name="apple" testID="goto-apple" href="/apple">
                  <Text>Apple</Text>
                </TabTrigger>
                <TabTrigger name="banana" testID="goto-banana" href="/banana/ok">
                  <Text>Banana</Text>
                </TabTrigger>
                <TabTrigger name="orange" testID="goto-orange" href="/orange">
                  <Text>Orange</Text>
                </TabTrigger>
              </TabList>
              <TabSlot />
            </Tabs>
          );
        },
      },
      '(group)/apple': () => <Text testID="apple">Apple</Text>,

      // Banana
      '(group)/banana/_layout': {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => <Stack />,
      },
      '(group)/banana/index': () => <Text testID="banana">Banana</Text>,
      '(group)/banana/color': () => <Text testID="banana-color">Banana Color</Text>,
      '(group)/banana/shape': () => <Text testID="banana">Banana Shape</Text>,
      '(group)/banana/[test]': () => <Text testID="banana">Banana dynamic</Text>,

      // Orange
      '(group)/orange/_layout': {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => <Stack />,
      },
      '(group)/orange/index': () => <Text testID="orange">Orange</Text>,
      '(group)/orange/color': () => <Text testID="orange-color">Orange Color</Text>,
      '(group)/orange/shape': () => <Text testID="orange">Orange Shape</Text>,
    },
    options
  );

it.only('should render the correct screen with nested navigators', () => {
  render({ initialUrl: '/apple' });
  expect(screen).toHaveSegments(['(group)', 'apple']);

  console.log('--------');
  fireEvent.press(screen.getByTestId('goto-banana'));
  // expect(screen).toHaveSegments(['(group)', 'banana', 'color']);
  act(() => router.push('/banana/shape'));
  // expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);

  fireEvent.press(screen.getByTestId('goto-orange'));
  // expect(screen).toHaveSegments(['(group)', 'orange']);
  act(() => router.push('/orange/color'));
  // expect(screen).toHaveSegments(['(group)', 'orange', 'color']);

  // Banana should retain its state
  fireEvent.press(screen.getByTestId('goto-banana'));
  // expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);
});

it('should respect `unstable_settings', () => {
  render({ initialUrl: '/orange' });
  expect(screen).toHaveSegments(['(group)', 'orange']);

  expect(screen.getByTestId('orange')).toBeVisible();
  expect(router.canGoBack()).toBe(false);

  // Reset the app, but start at /banana
  screen.unmount();
  render({ initialUrl: '/banana' });

  // Orange should be the initialRouteName, because we are now in (two)
  expect(screen.getByTestId('banana')).toBeVisible();
  act(() => router.back());
  expect(screen.getByTestId('orange')).toBeVisible();
});
