import React from 'react';
import { Text, View } from 'react-native';

import { store } from '../global-state/router-store';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, renderRouter, screen } from '../testing-library';
import { Slot } from '../views/Navigator';

it('stacks should always push a new route', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': () => <Stack />,
    '(group)/user/[id]/_layout': () => <Stack />,
    '(group)/user/[id]/index': function User() {
      return <View testID={JSON.stringify(useLocalSearchParams())} />;
    },
    '(group)/post/[id]/_layout': () => <Stack />,
    '(group)/post/[id]/index': () => null,
  });

  // Initial stale state
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  /**
   * Need to push separately so a new state is generated every time, otherwise they are batched
   * Every `push` event should create a new history frame
   */
  act(() => router.push('/post/1'));
  act(() => router.push('/user/1'));
  act(() => router.push('/post/2'));
  act(() => router.push('/user/1'));
  act(() => router.push('/user/2'));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 5,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '(group)', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          params: {
            id: '1',
            params: {
              id: '1',
            },
            screen: 'index',
          },
          screen: 'post/[id]',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          params: {
            id: '1',
            params: {
              id: '1',
            },
            screen: 'index',
          },
          screen: 'user/[id]',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '2',
          params: {
            id: '2',
            params: {
              id: '2',
            },
            screen: 'index',
          },
          screen: 'post/[id]',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          params: {
            id: '1',
            params: {
              id: '1',
            },
            screen: 'index',
          },
          screen: 'user/[id]',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '2',
          params: {
            id: '2',
            params: {
              id: '2',
            },
            screen: 'index',
          },
          screen: 'user/[id]',
        },
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('can push & replace with nested Slots', async () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text testID="index" />,
    'one/_layout': () => <Slot />,
    'one/index': () => <Text testID="one" />,
  });

  act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  // Correctly targets the `root` slot (sets target: <root layout key>)
  act(() => router.push('/'));
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();
});

it('pushing should correctly created a nested state', async () => {
  renderRouter({
    index: () => <Text testID="index" />,
    _layout: () => <Stack />,
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/one': () => <Text testID="one" />,
    '(tabs)/two': () => <Text testID="two" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.push('/two'));
  expect(screen).toHavePathname('/two');

  act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');

  // If the push worked correctly, (tabs) should be a nested state.
  // Going back from the first tab should close the tab navigator
  // This is special functionality of the tab navigator
  // https://snack.expo.dev/@mwlawlor/nested-tab-navigator
  act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('works in a nested layout Stack->Tab->Stack', () => {
  renderRouter({
    index: () => null,
    _layout: () => <Stack />,
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/a': () => <Text testID="a" />,
    '(tabs)/b': () => <Text testID="b" />,
    '(tabs)/c/_layout': () => <Stack />,
    '(tabs)/c/one': () => <Text testID="c/one" />,
    '(tabs)/c/two': () => <Text testID="c/two" />,
    d: () => <Text testID="d" />,
  });

  act(() => router.push('/a'));
  expect(screen).toHavePathnameWithParams('/a');
  expect(screen.getByTestId('a')).toBeOnTheScreen();

  act(() => router.push('/b'));
  expect(screen).toHavePathnameWithParams('/b');
  expect(screen.getByTestId('b')).toBeOnTheScreen();

  act(() => router.push('/c/one'));
  expect(screen).toHavePathnameWithParams('/c/one');
  expect(screen.getByTestId('c/one')).toBeOnTheScreen();

  act(() => router.push('/c/two'));
  expect(screen).toHavePathnameWithParams('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();

  act(() => router.push('/c/two'));
  expect(screen).toHavePathnameWithParams('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();

  act(() => router.push('/d'));
  expect(screen).toHavePathnameWithParams('/d');
  expect(screen.getByTestId('d')).toBeOnTheScreen();

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 2,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '(tabs)', 'd', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '(tabs)',
        path: undefined,
        state: {
          history: [
            {
              key: expect.any(String),
              type: 'route',
            },
            {
              key: expect.any(String),
              type: 'route',
            },
          ],
          index: 2,
          key: expect.any(String),
          preloadedRouteKeys: [],
          routeNames: ['a', 'b', 'c'],
          routes: [
            {
              key: expect.any(String),
              name: 'a',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'b',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'c',
              path: undefined,
              state: {
                index: 2,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['one', 'two'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'one',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'two',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'two',
                    params: {},
                    path: undefined,
                  },
                ],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'tab',
        },
      },
      {
        key: expect.any(String),
        name: 'd',
        params: {},
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('targets the correct Stack when pushing to a nested layout', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      a: () => null,
      b: () => null,
      'one/_layout': () => <Stack />,
      'one/index': () => <View testID="one" />,
      'one/page': () => <View testID="one/page" />,
      'one/two/_layout': () => <Stack />,
      'one/two/index': () => <View testID="one/two" />,
      'one/two/page': () => <View testID="one/two/page" />,
    },
    {
      initialUrl: '/a',
    }
  );

  act(() => router.push('/b')); // Should at at index 1 on the root stack

  act(() => router.push('/one')); // Should at at index 2 on the root stack
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.push('/one/page')); // Should at at index 1, nested inside index 2 on the root stack
  expect(screen.getByTestId('one/page')).toBeOnTheScreen();

  act(() => router.push('/one/two')); // Should at at index 2, nested inside index 2 on the root stack
  expect(screen.getByTestId('one/two')).toBeOnTheScreen();

  act(() => router.push('/one/two/page')); // Should at at index 1, nested inside index 2, inside index 2 on the root stack
  expect(screen.getByTestId('one/two/page')).toBeOnTheScreen();

  act(() => router.push('/a')); // Should push to the root stack

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 3,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['a', 'b', 'one', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'a',
        params: undefined,
        path: '/a',
      },
      {
        key: expect.any(String),
        name: 'b',
        params: {},
        path: undefined,
      },
      {
        key: expect.any(String),
        name: 'one',
        path: undefined,
        state: {
          index: 2,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', 'two', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'page',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'two',
              path: undefined,
              state: {
                index: 1,
                key: expect.any(String),
                preloadedRoutes: [],
                routeNames: ['index', 'page'],
                routes: [
                  {
                    key: expect.any(String),
                    name: 'index',
                    params: {},
                    path: undefined,
                  },
                  {
                    key: expect.any(String),
                    name: 'page',
                    params: {},
                    path: undefined,
                  },
                ],
                stale: false,
                type: 'stack',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
      {
        key: expect.any(String),
        name: 'a',
        params: {},
        path: undefined,
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('push should also add anchor routes', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': {
      default: () => <Stack />,
      unstable_settings: {
        anchor: 'apple',
      },
    },
    '(group)/index': () => null,
    '(group)/apple': () => null,
    '(group)/orange': () => null,
  });

  // Initial stale state
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  act(() => router.push('/orange', { withAnchor: true }));

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 1,
    key: expect.any(String),
    preloadedRoutes: [],
    routeNames: ['index', '(group)', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: '(group)',
        path: undefined,
        state: {
          index: 1,
          preloadedRoutes: [],
          key: expect.any(String),
          routeNames: ['apple', 'index', 'orange'],
          routes: [
            {
              key: expect.any(String),
              name: 'apple',
              params: undefined,
            },
            {
              key: expect.any(String),
              name: 'orange',
              params: {},
              path: undefined,
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
