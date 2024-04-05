import React, { Text } from 'react-native';

import { Slot, router } from '../exports';
import { store } from '../global-state/router-store';
import { screen, renderRouter, act } from '../testing-library';

it('preserves state across nested slots', () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text>index</Text>,
    'one/_layout': () => <Slot />,
    'one/index': () => <Text>one/index</Text>,
    'one/page': () => <Text>one/page</Text>,
    'two/_layout': () => <Slot />,
    'two/index': () => <Text>two/index</Text>,
    'two/page': () => <Text>two/page</Text>,
  });

  store.subscribeToRootState(() => {
    act(() => jest.runOnlyPendingTimers());
  });

  act(() => router.push('/one'));
  expect(screen.getByText('one/index')).toBeOnTheScreen();
  act(() => router.push('/one/page'));
  expect(screen.getByText('one/page')).toBeOnTheScreen();

  act(() => router.push('/two'));
  expect(screen.getByText('two/index')).toBeOnTheScreen();

  act(() => router.push('/two/page'));
  expect(screen.getByText('two/page')).toBeOnTheScreen();

  // Each slot should be grouped
  expect(screen).toHaveRouterState({
    index: 2,
    key: expect.any(String),
    routeNames: ['index', 'one', 'two', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: 'one',
        params: {
          params: {},
          screen: 'index',
        },
        path: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
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
      {
        key: expect.any(String),
        name: 'two',
        params: {
          params: {},
          screen: 'index',
        },
        path: undefined,
        state: {
          index: 1,
          key: expect.any(String),
          routeNames: ['index', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {},
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
  });

  act(() => router.back());
  act(() => router.back());
  act(() => router.back());

  // Navigation should go back in a linear fashion through the sub groups
  expect(screen).toHaveRouterState({
    index: 1,
    key: expect.any(String),
    routeNames: ['index', 'one', 'two', '_sitemap', '+not-found'],
    routes: [
      {
        key: expect.any(String),
        name: 'index',
        params: undefined,
        path: '/',
      },
      {
        key: expect.any(String),
        name: 'one',
        params: {
          params: {},
          screen: 'index',
        },
        path: undefined,
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index', 'page'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
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

  expect(screen.getByText('one/index')).toBeOnTheScreen();
});
