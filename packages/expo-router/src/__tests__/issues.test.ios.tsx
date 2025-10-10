import { useIsFocused } from '@react-navigation/core';
import { act, screen } from '@testing-library/react-native';
import React, { useEffect } from 'react';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { Stack } from '../layouts/Stack';
import { renderRouter, waitFor } from '../testing-library';

it('should not render generated screens', async () => {
  expect(() =>
    renderRouter({
      _layout: function Layout() {
        const [ready, setReady] = React.useState(false);
        useEffect(() => {
          setReady(true);
        }, []);
        if (!ready) {
          return null;
        }
        return <Stack />;
      },
      index: function Index() {
        const isFocused = useIsFocused();
        useEffect(() => {
          if (isFocused) {
            router.push('/second');
          }
        }, [isFocused]);
        return <Text testID="index">Index</Text>;
      },
      second: () => <Text testID="second">Second</Text>,
    })
  ).not.toThrow(
    'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
  );

  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.queryByTestId('inner-index')).toBeNull();
  expect(screen.queryByTestId('inner-second')).toBeNull();
});

it('should not render generated screens', async () => {
  const layoutMount = jest.fn();
  const innerLayoutMount = jest.fn();
  const innerIndexMount = jest.fn();
  const innerSecondMount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      const [ready, setReady] = React.useState(false);
      useEffect(() => {
        layoutMount();
        setReady(true);
      }, []);
      if (!ready) {
        return null;
      }
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

it('should not render generated screens', async () => {
  const layoutMount = jest.fn();
  const innerLayoutMount = jest.fn();
  const innerIndexMount = jest.fn();
  const innerSecondMount = jest.fn();
  renderRouter({
    _layout: function Layout() {
      const [ready, setReady] = React.useState(false);
      useEffect(() => {
        layoutMount();
        setReady(true);
      }, []);
      if (!ready) {
        return null;
      }
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
      const [ready, setReady] = React.useState(false);
      useEffect(() => {
        innerIndexMount();
        setReady(true);
      }, []);
      useEffect(() => {
        if (ready && isFocused) {
          router.push('/inner/second');
        }
      }, [isFocused, ready]);
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

  expect(() => {
    act(() => {
      router.push('/inner');
    });
  }).not.toThrow();

  await waitFor(() => expect(screen.getByTestId('inner-second')).toBeVisible());
  expect(screen.queryByTestId('index')).toBeNull();
  expect(screen.queryByTestId('inner-index')).toBeNull();

  expect(layoutMount).toHaveBeenCalledTimes(1);
  expect(innerLayoutMount).toHaveBeenCalledTimes(1);
  expect(innerIndexMount).toHaveBeenCalledTimes(1);
  expect(innerSecondMount).toHaveBeenCalledTimes(1);
});
