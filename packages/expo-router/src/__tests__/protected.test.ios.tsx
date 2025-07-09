import React, { createContext, Dispatch, SetStateAction, use, useState } from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, fireEvent, renderRouter, screen } from '../testing-library';

it('should protect routes during the initial load', () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  renderRouter(
    {
      _layout: function Layout() {
        useStateResult = useState(false);
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={useStateResult[0]}>
              <Stack.Screen name="a" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => {
        return <Text testID="index">index</Text>;
      },
      a: () => <Text testID="a">a</Text>,
      b: () => <Text testID="b">B</Text>,
      c: () => <Text testID="c">C</Text>,
    },
    { initialUrl: '/a' }
  );

  // This should be a stale state for the /a route, but index should be visible
  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'a',
              path: '/a',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // Enable the /a route
  act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'index', 'b', 'c', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('should default to anchor during initial load', () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  renderRouter(
    {
      _layout: {
        unstable_settings: {
          anchor: 'b',
        },
        default: function Layout() {
          useStateResult = useState(false);
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={useStateResult[0]}>
                <Stack.Screen name="a" />
              </Stack.Protected>

              <Stack.Screen name="b" />
            </Stack>
          );
        },
      },
      index: () => {
        return <Text testID="index">index</Text>;
      },
      a: () => <Text testID="a">a</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          index: 1,
          routes: [
            {
              name: 'b',
              params: undefined,
            },
            {
              name: 'a',
              path: '/a',
            },
          ],
          stale: true,
        },
      },
    ],
    stale: true,
  });

  expect(screen.getByTestId('b')).toBeVisible();

  // Enable the /a route
  act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['__root'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['a', 'b', 'index', '_sitemap', '+not-found'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('will wait for React state updates before pushing', async () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  renderRouter({
    _layout: function Layout() {
      const [value, setState] = useState(false);

      return (
        <SetterContext value={setState}>
          <Stack>
            <Stack.Protected guard={value}>
              <Stack.Screen name="protected" />
            </Stack.Protected>
          </Stack>
        </SetterContext>
      );
    },
    index: function Index() {
      const setState = use(SetterContext);

      return (
        <Text
          testID="index"
          onPress={() => {
            setState(true);
            router.push('/protected');
          }}>
          Index
        </Text>
      );
    },
    protected: function Nested() {
      return <Text testID="protected">Protected</Text>;
    },
  });

  fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/protected');
});

it('works with tabs', () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  renderRouter({
    _layout: function Layout() {
      const [value, setState] = useState(false);

      return (
        <SetterContext value={setState}>
          <Tabs>
            <Tabs.Screen name="index" />

            <Tabs.Protected guard={value}>
              <Tabs.Screen name="protected" />
            </Tabs.Protected>
          </Tabs>
        </SetterContext>
      );
    },
    index: function Index() {
      const setState = use(SetterContext);

      return (
        <Text
          testID="index"
          onPress={() => {
            router.push('/protected');
          }}
          onLongPress={() => {
            setState(true);
            router.push('/protected');
          }}>
          Index
        </Text>
      );
    },
    protected: function Nested() {
      return <Text testID="protected">Protected</Text>;
    },
  });

  expect(screen.queryByLabelText('protected, tab, 2 of 4')).toBeNull();

  fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/');

  fireEvent(screen.getByTestId('index'), 'longPress');

  expect(screen).toHavePathname('/protected');
  expect(screen.queryByLabelText('protected, tab, 2 of 4')).toBeVisible();
});
