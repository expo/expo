import { act, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { usePathname } from '../hooks';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter, fireEvent } from '../testing-library';

it('should return correct pathname for nested stack with initialRouteName', async () => {
  const indexRenderCount = jest.fn();
  const innerIndexRenderCount = jest.fn();
  const innerARenderCount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      return <Tabs />;
    },
    index: function Index() {
      indexRenderCount();
      return <Text testID="index-pathname">{usePathname()}</Text>;
    },
    'inner/_layout': () => <Stack initialRouteName="a" />,
    'inner/index': function InnerIndex() {
      innerIndexRenderCount();
      return <Text testID="inner-index-pathname">{usePathname()}</Text>;
    },
    'inner/a': function InnerA() {
      innerARenderCount();
      return <Text testID="inner-a-pathname">{usePathname()}</Text>;
    },
  });

  expect(screen.getByTestId('index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('index-pathname')).toHaveTextContent('/');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);

  indexRenderCount.mockClear();

  act(() => fireEvent.press(screen.getByLabelText('inner, tab, 2 of 2')));

  expect(screen.queryByTestId('index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.getByTestId('inner-a-pathname')).toBeVisible();
  expect(screen.getByTestId('inner-a-pathname')).toHaveTextContent('/inner/a');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(1);
});

it('should return correct pathname for nested stack with initialRouteName, after push', async () => {
  const indexRenderCount = jest.fn();
  const innerIndexRenderCount = jest.fn();
  const innerARenderCount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      return <Tabs />;
    },
    index: function Index() {
      indexRenderCount();
      return <Text testID="index-pathname">{usePathname()}</Text>;
    },
    'inner/_layout': () => <Stack initialRouteName="a" />,
    'inner/index': function InnerIndex() {
      innerIndexRenderCount();
      return <Text testID="inner-index-pathname">{usePathname()}</Text>;
    },
    'inner/a': function InnerA() {
      innerARenderCount();
      return <Text testID="inner-a-pathname">{usePathname()}</Text>;
    },
  });

  expect(screen.getByTestId('index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-index-pathname')).toBeNull();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('index-pathname')).toHaveTextContent('/');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(0);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);

  indexRenderCount.mockClear();

  act(() => router.push('/inner'));

  expect(screen.queryByTestId('index-pathname')).toBeNull();
  expect(screen.getByTestId('inner-index-pathname')).toBeVisible();
  expect(screen.queryByTestId('inner-a-pathname')).toBeNull();
  expect(screen.getByTestId('inner-index-pathname')).toHaveTextContent('/inner');
  expect(indexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerIndexRenderCount).toHaveBeenCalledTimes(1);
  expect(innerARenderCount).toHaveBeenCalledTimes(0);
});
