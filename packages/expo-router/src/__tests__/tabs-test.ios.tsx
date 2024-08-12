import React from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { RenderRouterOptions, act, fireEvent, renderRouter, screen } from '../testing-library';

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

describe('should render the correct screen with nested navigators', () => {
  it('press tabs', () => {
    render({ initialUrl: '/apple' });
    expect(screen).toHaveSegments(['(group)', 'apple']);

    fireEvent.press(screen.getByText('banana'));
    expect(screen).toHaveSegments(['(group)', 'banana']);
    act(() => router.push('/banana/color'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'color']);
    act(() => router.push('/banana/shape'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);

    fireEvent.press(screen.getByText('orange'));
    expect(screen).toHaveSegments(['(group)', 'orange']);
    act(() => router.push('/orange/color'));
    expect(screen).toHaveSegments(['(group)', 'orange', 'color']);

    // Banana should retain its state
    fireEvent.press(screen.getByText('banana'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);
  });

  it('imperative api', () => {
    render({ initialUrl: '/apple' });
    expect(screen).toHaveSegments(['(group)', 'apple']);

    act(() => router.replace('/banana'));
    expect(screen).toHaveSegments(['(group)', 'banana']);
    act(() => router.push('/banana/color'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'color']);
    act(() => router.push('/banana/shape'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);

    act(() => router.replace('/orange'));
    expect(screen).toHaveSegments(['(group)', 'orange']);
    act(() => router.push('/orange/color'));
    expect(screen).toHaveSegments(['(group)', 'orange', 'color']);

    // Banana should retain its state when doing a switch
    act(() => router.switch('/banana'));
    expect(screen).toHaveSegments(['(group)', 'banana', 'shape']);

    act(() => router.replace('/apple'));

    // A hard replace will reset the state of the tab
    act(() => router.replace('/banana'));
    expect(screen).toHaveSegments(['(group)', 'banana']);
  });
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
