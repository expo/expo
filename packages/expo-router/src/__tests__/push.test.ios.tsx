import React from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { act, renderRouter, screen } from '../testing-library';
import { Slot } from '../views/Navigator';

it.only('stacks should always push a new route', () => {
  renderRouter({
    index: () => null,
    '(group)/_layout': () => <Stack />,
    '(group)/user/[id]/_layout': () => <Stack />,
    '(group)/user/[id]/index': () => null,
    '(group)/post/[id]/_layout': () => <Stack />,
    '(group)/post/[id]/index': () => null,
  });

  // Initial stale state
  expect(store.rootStateSnapshot()).toEqual({
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
    index: 4,
    key: expect.any(String),
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
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['user/[id]', 'post/[id]'],
          routes: [
            {
              key: expect.any(String),
              name: 'post/[id]',
              params: {
                id: '1',
                params: {
                  id: '1',
                },
                screen: 'index',
              },
            },
            {
              key: expect.any(String),
              name: 'user/[id]',
              params: {
                id: '1',
                params: {
                  id: '1',
                },
                screen: 'index',
              },
            },
          ],
          stale: false,
          type: 'stack',
        },
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

  act(() => router.push('/apple/2/color')); // Tabs don't push, so this doesn't affect the history
  expect(screen).toHavePathname('/apple/2/color');

  /**
   * When we go back, it will return to the last route in the stack.
   * It goes to the taste tab, as its the first router in the Tab history
   */
  act(() => router.back());
  expect(screen).toHavePathname('/apple/1/taste');

  /**
   * We move forward, targeting both a new Stack and Tab
   */
  act(() => router.push('/apple/2/color'));
  expect(screen).toHavePathname('/apple/2/color');

  /**
   * And if we go back it takes us back to where we were
   */
  act(() => router.back());
  expect(screen).toHavePathname('/apple/1/taste');
});
