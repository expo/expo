import { useIsFocused } from '@react-navigation/core';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { usePathname } from '../hooks';
import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter, fireEvent, act, waitFor, screen } from '../testing-library';

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

it('can navigate during first render', async () => {
  expect(() =>
    renderRouter({
      _layout: function Layout() {
        const [ready, setReady] = useState(false);
        useEffect(() => {
          setReady(true);
        }, []);
        if (!ready) {
          return null;
        }
        return <Stack />;
      },
      index: function Index() {
        useEffect(() => {
          router.push('/second');
        }, []);
        return <Text testID="index">Index</Text>;
      },
      second: () => <Text testID="second">Second</Text>,
    })
  ).not.toThrow(
    'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
  );

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.queryByTestId('index')).toBeNull();

  act(() => router.back());

  await waitFor(() => expect(screen.getByTestId('index')).toBeVisible());
  expect(screen.queryByTestId('second')).toBeNull();
});

it('can navigate during first render of nested navigator', async () => {
  const layoutMount = jest.fn();
  const innerLayoutMount = jest.fn();
  const innerIndexMount = jest.fn();
  const innerSecondMount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      useEffect(() => {
        layoutMount();
      }, []);
      return <Stack />;
    },
    index: () => <Text testID="index">Index</Text>,
    'inner/_layout': function InnerLayout() {
      useEffect(() => {
        innerLayoutMount();
      }, []);
      return <Stack />;
    },
    'inner/index': function Index() {
      const isFocused = useIsFocused();
      useEffect(() => {
        innerIndexMount();
      }, []);
      useEffect(() => {
        if (isFocused) {
          router.push('/inner/second');
        }
      }, [isFocused]);
      return <Text testID="inner-index">Inner Index</Text>;
    },
    'inner/second': function Second() {
      useEffect(() => {
        innerSecondMount();
      }, []);
      return <Text testID="inner-second">Inner Second</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.queryByTestId('inner-index')).toBeNull();
  expect(screen.queryByTestId('inner-second')).toBeNull();
  expect(layoutMount).toHaveBeenCalledTimes(1);
  expect(innerLayoutMount).toHaveBeenCalledTimes(0);
  expect(innerIndexMount).toHaveBeenCalledTimes(0);
  expect(innerSecondMount).toHaveBeenCalledTimes(0);

  act(() => {
    router.push('/inner');
  });

  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.queryByTestId('inner-index')).toBeNull();
  expect(screen.getByTestId('inner-second')).toBeVisible();
  expect(layoutMount).toHaveBeenCalledTimes(1);
  expect(innerLayoutMount).toHaveBeenCalledTimes(1);
  expect(innerIndexMount).toHaveBeenCalledTimes(1);
  expect(innerSecondMount).toHaveBeenCalledTimes(1);
});
