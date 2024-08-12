import React from 'react';
import { Text } from 'react-native';
import { RenderRouterOptions, act, fireEvent, renderRouter, screen } from '../testing-library';
import { router } from '../imperative-api';
import { Tabs } from '../layouts/Tabs';
import Stack from '../layouts/Stack';

const render = (options: RenderRouterOptions = {}) =>
  renderRouter(
    {
      '(group)/_layout': {
        unstable_settings: {
          initialRouteName: 'orange',
        },
        default: () => <Tabs />,
      },
      '(group)/apple': () => <Text testID="apple">Apple</Text>,
      '(group)/banana/_layout': () => <Stack />,
      '(group)/banana/index': () => <Text testID="banana">Banana</Text>,
      '(group)/banana/color': () => <Text testID="banana-color">Banana Color</Text>,
      '(group)/banana/shape': () => <Text testID="banana">Banana Shape</Text>,
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

  fireEvent.press(screen.getByText('banana'));
  expect(screen).toHaveSegments(['(group)', 'banana']);
  console.log('-----');
  act(() => router.push('/banana/color'));
  expect(screen).toHaveRouterState({});
  expect(screen).toHaveSegments(['(group)', 'banana', 'color']);
  // act(() => router.push('/banana/shape'));
  // expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);

  // fireEvent.press(screen.getByText('orange'));
  // expect(screen).toHaveSegments(['(group)', 'orange']);
  // act(() => router.push('/orange/color'));
  // expect(screen).toHaveSegments(['(group)', 'orange', 'color']);

  // // Banana should retain its state
  // fireEvent.press(screen.getByText('banana'));
  // expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);
});

it('should respect `unstable_settings', () => {
  const render = (options: RenderRouterOptions = {}) =>
    renderRouter(
      {
        '(group)/_layout': {
          unstable_settings: {
            initialRouteName: 'orange',
          },
          default: () => <Tabs />,
        },
        '(group)/banana': () => <Text testID="banana">Banana</Text>,
        '(group)/orange': () => <Text testID="orange">Orange</Text>,
      },
      options
    );

  // Orange is the initial route for (two) so we are in (two)
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
