import React from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, renderRouter, screen, testRouter } from '../testing-library';
import { Slot } from '../views/Navigator';

it('stacks should always push a new route', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': () => <Stack />,
    '(group)/user/[id]/_layout': () => <Stack />,
    '(group)/user/[id]/index': () => null,
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
    stale: false,
    type: 'stack',
    key: expect.any(String),
    index: 5,
    routeNames: ['index', '(group)', '_sitemap', '+not-found'],
    routes: [
      {
        name: 'index',
        path: '/',
        key: expect.any(String),
        params: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          screen: 'post/[id]',
          params: {
            id: '1',
            screen: 'index',
            params: {
              id: '1',
            },
          },
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          screen: 'user/[id]',
          params: {
            id: '1',
            screen: 'index',
            params: {
              id: '1',
            },
          },
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '2',
          screen: 'post/[id]',
          params: {
            id: '2',
            screen: 'index',
            params: {
              id: '2',
            },
          },
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '1',
          screen: 'user/[id]',
          params: {
            id: '1',
            screen: 'index',
            params: {
              id: '1',
            },
          },
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(group)',
        params: {
          id: '2',
          screen: 'user/[id]',
          params: {
            id: '2',
            screen: 'index',
            params: {
              id: '2',
            },
          },
        },
        path: undefined,
      },
    ],
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

it('should navigate as expected when nested Stacks & Tabs', async () => {
  renderRouter({
    index: () => <Text testID="index" />,
    'apple/_layout': () => <Stack />,
    'apple/index': () => <Text testID="apple" />,
    'apple/[type]/_layout': () => <Tabs />,
    'apple/[type]/color': () => <Text testID="color" />,
    'apple/[type]/taste': () => <Text testID="taste" />,
  });

  act(() => router.push('/apple')); // PUsh to the root Stack
  expect(screen).toHavePathname('/apple');
  expect(screen.getByTestId('apple')).toBeOnTheScreen();

  act(() => router.push('/apple/1/color')); // Push to the apple/layout
  expect(screen).toHavePathname('/apple/1/color');

  act(() => router.push('/apple/1/taste')); // Tabs don't push, so this doesn't affect the history
  expect(screen).toHavePathname('/apple/1/taste');

  act(() => router.push('/apple/2/taste')); // [type] is outside of the tabs, so it pushed to apple/_layout
  expect(screen).toHavePathname('/apple/2/taste');

  act(() => router.push('/apple/2/color'));
  expect(screen).toHavePathname('/apple/2/color');

  act(() => router.back());
  expect(screen).toHavePathname('/apple/2/taste');

  act(() => router.push('/apple/2/color'));
  expect(screen).toHavePathname('/apple/2/color');

  act(() => router.back());
  expect(screen).toHavePathname('/apple/2/taste');
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
    d: () => null,
  });

  testRouter.push('/a');
  expect(screen.getByTestId('a')).toBeOnTheScreen();
  testRouter.push('/b');
  expect(screen.getByTestId('b')).toBeOnTheScreen();
  testRouter.push('/c/one');
  expect(screen.getByTestId('c/one')).toBeOnTheScreen();
  testRouter.push('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();
  testRouter.push('/c/two');
  expect(screen.getByTestId('c/two')).toBeOnTheScreen();

  testRouter.push('/d');

  expect(store.rootStateSnapshot()).toStrictEqual({
    index: 6,
    key: expect.any(String),
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
        params: {
          params: {},
          screen: 'a',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(tabs)',
        params: {
          params: {},
          screen: 'b',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(tabs)',
        params: {
          params: {
            params: {},
            screen: 'one',
          },
          screen: 'c',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(tabs)',
        params: {
          params: {
            params: {},
            screen: 'two',
          },
          screen: 'c',
        },
        path: undefined,
      },
      {
        key: expect.any(String),
        name: '(tabs)',
        params: {
          params: {
            params: {},
            screen: 'two',
          },
          screen: 'c',
        },
        path: undefined,
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
