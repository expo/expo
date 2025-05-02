import React from 'react';
import { Text } from 'react-native';

import { router } from '../exports';
import { useSegments } from '../hooks';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { fireEvent, act, renderRouter, screen } from '../testing-library';

it('should not render generated screens', () => {
  renderRouter({
    _layout: () => <Tabs />,
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 1 of 3').parent;

  expect(tabList?.children).toHaveLength(1);
});

it('screens can be hidden', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="hidden" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    hidden: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 2 of 4').parent;

  expect(tabList?.children).toHaveLength(1);
});

it('has correct routeInfo when switching tabs as a nested navigator - using api', () => {
  const layoutCalls = jest.fn();
  const indexCalls = jest.fn();
  const exploreCalls = jest.fn();

  /**
   * In this instance, React Navigation fires the state update before the screen is rendered.
   */
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': function Layout() {
        layoutCalls(useSegments());
        return <Tabs />;
      },
      '(tabs)/index': function Index() {
        indexCalls(useSegments());
        return <Text testID="index">Index</Text>;
      },
      '(tabs)/explore': function Explore() {
        exploreCalls(useSegments());
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/?test=123',
    }
  );

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).not.toHaveBeenCalled();

  jest.clearAllMocks();
  act(() => router.push('/explore'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  jest.clearAllMocks();
  act(() => router.push('/'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)']);
});

it('has correct routeInfo when switching tabs as a nested navigator - using press', () => {
  /**
   * This test exists because there are inconsistencies when using press vs the API.
   * This is due to how React Navigation fires events on press (inconsistent) vs API calls (consistent).
   */
  const layoutCalls = jest.fn();
  const indexCalls = jest.fn();
  const exploreCalls = jest.fn();

  /**
   * In this instance, React Navigation fires the state update before the screen is rendered.
   */
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': function Layout() {
        layoutCalls(useSegments());
        return <Tabs />;
      },
      '(tabs)/index': function Index() {
        indexCalls(useSegments());
        return <Text testID="index">Index</Text>;
      },
      '(tabs)/explore': function Explore() {
        exploreCalls(useSegments());
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/?test=123',
    }
  );

  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(2);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);
  expect(layoutCalls).toHaveBeenNthCalledWith(2, ['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(2);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(2);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);
  expect(layoutCalls).toHaveBeenNthCalledWith(2, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(2);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)', 'explore']);
  expect(layoutCalls).toHaveBeenNthCalledWith(2, ['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(2);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);
});
